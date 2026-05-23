const DB_NAME = "TaskDB";
const DB_VERSION = 1;
const STORE_NAME = "tasks";

let db;

// DB を開く（Promise ラッパー）
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // オブジェクトストア（テーブル相当）の作成
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });

      // インデックスの作成（status フィールドで検索できるようにする）
      store.createIndex("status", "status", { unique: false });
      store.createIndex("priority", "priority", { unique: false });

      console.log("DB スキーマを作成しました");
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// トランザクションとストアを取得するヘルパー
function getStore(db, mode = "readonly") {
  const tx = db.transaction(STORE_NAME, mode);
  return { tx, store: tx.objectStore(STORE_NAME) };
}

// 結果を画面に表示するヘルパー
function display(label, data) {
  const output = document.getElementById("output");
  output.textContent = `[${label}]\n\n${JSON.stringify(data, null, 2)}`;
}

// 初期化
(async () => {
  db = await openDB();
  console.log("DB 接続完了");
})();

// INSERT：レコードの追加
const INITIAL_TASKS = [
  { title: "設計書のレビュー",    status: "todo",        priority: "high",   createdAt: "2026-05-01" },
  { title: "API の結合テスト",    status: "in_progress", priority: "high",   createdAt: "2026-05-02" },
  { title: "デプロイ手順の更新",  status: "todo",        priority: "medium", createdAt: "2026-05-03" },
  { title: "障害報告書の作成",    status: "done",        priority: "high",   createdAt: "2026-05-04" },
  { title: "コードレビュー依頼",  status: "todo",        priority: "low",    createdAt: "2026-05-05" },
  { title: "ユニットテストの追加", status: "in_progress", priority: "medium", createdAt: "2026-05-06" },
  { title: "リリースノート作成",  status: "todo",        priority: "low",    createdAt: "2026-05-07" },
  { title: "本番モニタリング確認", status: "done",        priority: "high",   createdAt: "2026-05-08" },
];

async function runInsert() {
  const { tx, store } = getStore(db, "readwrite");

  // 既存データをクリアしてから投入
  store.clear();

  let count = 0;
  for (const task of INITIAL_TASKS) {
    store.add(task);
    count++;
  }

  tx.oncomplete = () => {
    display("INSERT 完了", { message: `${count} 件のレコードを追加しました` });
  };
  tx.onerror = () => {
    display("INSERT エラー", { error: tx.error?.message });
  };
}


// SELECT（全件取得）
async function runSelectAll() {
  const { store } = getStore(db, "readonly");
  const request = store.getAll();

  request.onsuccess = () => {
    display("SELECT 全件", request.result);
  };
  request.onerror = () => {
    display("SELECT エラー", { error: request.error?.message });
  };
}


// SELECT（インデックス検索）
async function runSelectByIndex() {
  const { store } = getStore(db, "readonly");
  const index = store.index("status");

  // status = "todo" のレコードを取得
  const request = index.getAll("todo");

  request.onsuccess = () => {
    display('SELECT（status = "todo"）', {
      count: request.result.length,
      records: request.result,
    });
  };
  request.onerror = () => {
    display("SELECT エラー", { error: request.error?.message });
  };
}


// UPDATE：レコードの更新
async function runUpdate() {
  const { tx, store } = getStore(db, "readwrite");

  // まず id:1 を取得してから更新する
  const getRequest = store.get(1);

  getRequest.onsuccess = () => {
    const record = getRequest.result;

    if (!record) {
      display("UPDATE", { error: "id:1 のレコードが存在しません（先に INSERT を実行してください）" });
      return;
    }

    const updated = {
      ...record,
      status: "done",
      updatedAt: new Date().toISOString(),
    };

    const putRequest = store.put(updated);

    putRequest.onsuccess = () => {
      display("UPDATE 完了", { before: record, after: updated });
    };
  };

  tx.onerror = () => {
    display("UPDATE エラー", { error: tx.error?.message });
  };
}


// DELETE：レコードの削除
async function runDelete() {
  const { tx, store } = getStore(db, "readwrite");

  const deleteRequest = store.delete(1);

  deleteRequest.onsuccess = () => {
    display("DELETE 完了", { message: "id:1 を削除しました" });
  };

  tx.onerror = () => {
    display("DELETE エラー", { error: tx.error?.message });
  };
}

// トランザクション検証
async function runTransactionSuccess() {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // 2件のレコードを1トランザクションで追加
    store.add({
      title: "トランザクションテスト A",
      status: "todo",
      priority: "high",
      createdAt: new Date().toISOString(),
    });

    store.add({
      title: "トランザクションテスト B",
      status: "todo",
      priority: "medium",
      createdAt: new Date().toISOString(),
    });

    tx.oncomplete = () => {
      display("トランザクション（成功）", {
        message: "A・B 両方のレコードが追加されました",
      });
      resolve();
    };

    tx.onerror = () => {
      display("トランザクション エラー", { error: tx.error?.message });
      resolve();
    };
  });
}

// ロールバック
async function runTransactionFail() {
  // 事前に全件取得して件数を記録しておく
  const beforeCount = await new Promise((resolve) => {
    const { store } = getStore(db, "readonly");
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
  });

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // 1件目：正常な追加
    store.add({
      title: "ロールバックテスト（追加されるはずが…）",
      status: "todo",
      priority: "high",
      createdAt: new Date().toISOString(),
    });

    // 2件目：keyPath（id）に文字列を渡して意図的にエラーを起こす
    // autoIncrement なのに手動で id を指定し、既存の id と衝突させる
    store.add({
      id:2,  // すでに存在するキーを指定（ConstraintError を発生させる）
      title: "これは失敗する",
      status: "todo",
      priority: "low",
      createdAt: new Date().toISOString(),
    });

    tx.oncomplete = () => {
      // 正常完了した場合（本来はここに来ないはず）
      display("トランザクション（想定外の成功）", { message: "ロールバックが起きませんでした" });
      resolve();
    };

    tx.onerror = async () => {
      // エラー → トランザクション全体がロールバックされているはず
      const afterCount = await new Promise((res) => {
        const { store: s } = getStore(db, "readonly");
        const r = s.count();
        r.onsuccess = () => res(r.result);
      });

      display("トランザクション（失敗・ロールバック確認）", {
        message: "エラーが発生したため、トランザクション全体がロールバックされました",
        error: tx.error?.message,
        件数の変化: {
          処理前: beforeCount,
          処理後: afterCount,
          差分: afterCount - beforeCount,
        },
      });
      resolve();
    };
  });
}
