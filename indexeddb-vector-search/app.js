const documents = [
  "RAGはベクトル検索で関連文書を取得してからLLMに渡す仕組みだ",
  "Embeddingモデルは文章を高次元ベクトルに変換する",
  "コサイン類似度はベクトルの方向の近さを測る指標だ",
  "チャンク分割はRAGの精度に大きく影響する設計要素だ",
  "ベクトルDBはAnnoyやFaissなどの近似最近傍探索を使うことが多い",
  "LLMは大量のテキストデータで事前学習されたニューラルネットワークだ",
  "プロンプトエンジニアリングはLLMの出力品質を大きく左右する",
  "ファインチューニングは特定ドメインにLLMを適応させる手法だ",
  "コンテキストウィンドウの長さがLLMの利用コストに影響する",
  "MCPはLLMがツールや外部リソースを呼び出すための標準プロトコルだ",
  "マイクロサービスは運用コストが高く設計が難しい",
  "モノリスからマイクロサービスへの移行は段階的に行うべきだ",
  "設計判断を言語化できるエンジニアは現場での希少価値が高い",
  "APIゲートウェイはマイクロサービス間の通信を集約する役割を持つ",
  "イベント駆動アーキテクチャは非同期処理と疎結合を両立させる",
  "障害対応できるエンジニアはシステム全体の構造を理解している",
  "コードレビューは品質担保だけでなく知識共有の場でもある",
  "技術的負債は放置するほど返済コストが指数的に増える",
  "AIコーディングツールは実装速度を上げる一方で設計力は補えない",
  "生成AI企業のAPI料金は需要増加に伴い変動し続けている",
];

let db;

function createVector(text) {
  const vector = {};
  for (const char of text) {
    vector[char] = (vector[char] || 0) + 1;
  }
  return vector;
}

function cosineSimilarity(vec1, vec2) {
  const keys = new Set([
    ...Object.keys(vec1),
    ...Object.keys(vec2),
  ]);
  let dot = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (const key of keys) {
    const v1 = vec1[key] || 0;
    const v2 = vec2[key] || 0;
    dot   += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }
  if (norm1 === 0 || norm2 === 0) return 0;
  return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VectorDB", 1);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      const store = database.createObjectStore("docs", {
        keyPath: "id",
        autoIncrement: true,
      });

      const tx = event.target.transaction;
      tx.onerror = (e) => {
        console.error("初期データ登録に失敗しました:", e.target.error);
      };

      documents.forEach((text) => {
        const req = store.add({ text, vector: createVector(text) });
        req.onerror = (e) => {
          console.error("ドキュメント追加に失敗しました:", e.target.error);
        };
      });
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log("DB Ready");
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("DBのオープンに失敗しました:", event.target.error);
      reject(event.target.error);
    };
  });
}

function getAllDocs() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("docs", "readonly");
    const store = tx.objectStore("docs");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function search() {
  if (!db) {
    document.getElementById("result").textContent =
      "DBがまだ準備できていません。しばらく待ってから再試行してください。";
    return;
  }

  const query = document.getElementById("query").value.trim();
  if (!query) {
    document.getElementById("result").textContent = "検索ワードを入力してください。";
    return;
  }

  const queryVector = createVector(query);

  try {
    const docs = await getAllDocs();
    const results = docs
      .map((doc) => ({
        text: doc.text,
        score: cosineSimilarity(queryVector, doc.vector),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    document.getElementById("result").textContent =
      results.length > 0
        ? results.map((r) => `${r.text}\n  類似度: ${r.score.toFixed(2)}`).join("\n\n")
        : "該当するドキュメントが見つかりませんでした。";
  } catch (err) {
    console.error("検索中にエラーが発生しました:", err);
    document.getElementById("result").textContent =
      "検索中にエラーが発生しました: " + err.message;
  }
}

// ページ読み込み時にDBを初期化
initDB().catch((err) => {
  document.getElementById("result").textContent =
    "DBの初期化に失敗しました: " + err.message;
});