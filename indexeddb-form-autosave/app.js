const DB_NAME = "DraftDB";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      database.createObjectStore(STORE_NAME, { keyPath: "formId" });
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// 保存対象から除外する type 一覧
const EXCLUDED_TYPES = ["submit", "button", "reset", "image"];

// フォームのデータを収集して IndexedDB に保存する
async function saveDraft(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const fields = {};

  // form.elements でフォーム内の全要素を走査する
  for (const el of form.elements) {
    // id がある入力要素だけを対象にする（ボタン類・パスワードは除外）
    if (!el.id || EXCLUDED_TYPES.includes(el.type) || el.type === "password") {
      continue;
    }

    // checkbox・radio は checked を保存する。それ以外は value を保存する
    if (el.type === "checkbox" || el.type === "radio") {
      fields[el.id] = el.checked;
    } else {
      fields[el.id] = el.value;
    }
  }

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.put({ formId, fields, savedAt: new Date().toISOString() });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// IndexedDB から保存済みデータを取り出してフォームに反映する
async function restoreDraft(formId) {
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.get(formId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const record = request.result;
      if (!record) {
        resolve(null);
        return;
      }

      // 保存済みフィールドを走査して値をセットする
      for (const [id, value] of Object.entries(record.fields)) {
        const el = document.getElementById(id);
        if (!el) continue;

        // checkbox・radio は checked を復元する。それ以外は value を復元する
        if (el.type === "checkbox" || el.type === "radio") {
          el.checked = value;
        } else {
          el.value = value;
        }
      }

      resolve(record.savedAt);
    };
    request.onerror = () => reject(request.error);
  });
}

// 送信後などに下書きを削除する
async function clearDraft(formId) {
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(formId);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const FORM_ID = "applicationForm";

(async () => {
  db = await openDB();

  // ページ読み込み時に下書きを復元する
  const savedAt = await restoreDraft(FORM_ID);
  const status = document.getElementById("status");

  if (savedAt) {
    const date = new Date(savedAt).toLocaleString("ja-JP");
    status.textContent = `下書きを復元しました（最終保存：${date}）`;
  }

  // 入力のたびに自動保存する
  const form = document.getElementById(FORM_ID);
  form.addEventListener("input", async () => {
    await saveDraft(FORM_ID);
    const now = new Date().toLocaleString("ja-JP");
    status.textContent = `自動保存しました（${now}）`;
  });

  // 送信時に下書きを削除する
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await clearDraft(FORM_ID);
    status.textContent = "申請が完了しました。下書きを削除しました。";
    form.reset();
  });
})();
