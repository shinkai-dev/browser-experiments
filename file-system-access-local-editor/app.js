// File System Access API によるローカルファイル直接編集エディタのロジック一式
// OPFSは使わず、開いたフォルダ・ファイルを直接読み書きする

const app = {
  state: {
    dirHandle: null,         // 選択中のローカルディレクトリハンドル
    currentFileHandle: null, // 現在編集中のローカルファイルハンドル
    currentFileName: null,
  },
  dom: {},
};

document.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {
  cacheDom();
  const supported = checkApiSupport();
  bindEvents();
  if (!supported) {
    disableFolderFeatures();
  }
}

// DOM要素をまとめて取得
function cacheDom() {
  app.dom = {
    unsupportedWarning: document.getElementById('unsupportedWarning'),
    btnOpenFolder: document.getElementById('btnOpenFolder'),
    folderName: document.getElementById('folderName'),
    fileList: document.getElementById('fileList'),
    newFileName: document.getElementById('newFileName'),
    btnCreateFile: document.getElementById('btnCreateFile'),
    editorSection: document.getElementById('editorSection'),
    currentFileName: document.getElementById('currentFileName'),
    permissionBadge: document.getElementById('permissionBadge'),
    editorArea: document.getElementById('editorArea'),
    btnSaveLocal: document.getElementById('btnSaveLocal'),
    btnReload: document.getElementById('btnReload'),
    logOutput: document.getElementById('logOutput'),
  };
}

// ブラウザ対応状況をチェックし、非対応なら警告を出す
function checkApiSupport() {
  const hasFsAccess = 'showDirectoryPicker' in window;
  if (!hasFsAccess) {
    app.dom.unsupportedWarning.hidden = false;
    log('このブラウザは File System Access API に対応していません', 'error');
    return false;
  }
  return true;
}

function disableFolderFeatures() {
  app.dom.btnOpenFolder.disabled = true;
  app.dom.btnCreateFile.disabled = true;
}

function bindEvents() {
  app.dom.btnOpenFolder.addEventListener('click', openFolder);
  app.dom.btnCreateFile.addEventListener('click', createNewFile);
  app.dom.btnSaveLocal.addEventListener('click', overwriteLocalFile);
  app.dom.btnReload.addEventListener('click', reloadCurrentFile);
}

// ── フォルダ操作 ──────────────────────

// フォルダ選択ダイアログを開き、テキストファイル一覧を表示する
async function openFolder() {
  try {
    const dirHandle = await window.showDirectoryPicker();
    app.state.dirHandle = dirHandle;
    app.dom.folderName.textContent = `📁 ${dirHandle.name}`;
    log(`フォルダ "${dirHandle.name}" を開きました`);
    await listTextFiles(dirHandle);
  } catch (err) {
    if (err.name === 'AbortError') {
      log('フォルダ選択をキャンセルしました');
      return;
    }
    log(`フォルダを開けませんでした: ${err.message}`, 'error');
  }
}

// ディレクトリ内の .txt / .md ファイルのみを一覧表示する
async function listTextFiles(dirHandle) {
  app.dom.fileList.innerHTML = '';
  let count = 0;
  for await (const entry of dirHandle.values()) {
    if (entry.kind !== 'file' || !isTextFile(entry.name)) continue;
    count += 1;
    app.dom.fileList.appendChild(buildFileListItem(entry));
  }
  if (count === 0) {
    const li = document.createElement('li');
    li.textContent = '（.txt / .md ファイルが見つかりませんでした）';
    app.dom.fileList.appendChild(li);
  }
}

function buildFileListItem(fileHandle) {
  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = fileHandle.name;
  btn.addEventListener('click', () => selectLocalFile(fileHandle));
  li.appendChild(btn);
  return li;
}

function isTextFile(name) {
  return /\.(txt|md)$/i.test(name);
}

// ── 新規ファイル作成 ──────────────────────

// 入力されたファイル名で、開いているフォルダ内に新規ファイルを作成する
async function createNewFile() {
  if (!app.state.dirHandle) {
    log('先にローカルフォルダを開いてください', 'error');
    return;
  }
  const rawName = app.dom.newFileName.value.trim();
  if (!rawName) {
    log('ファイル名を入力してください', 'error');
    return;
  }
  const fileName = normalizeFileName(rawName);

  try {
    const granted = await ensureReadWritePermission(app.state.dirHandle);
    if (!granted) {
      log('フォルダへの書き込み権限が許可されませんでした', 'error');
      return;
    }
    // create: true かつ既存の同名ファイルがあればそれを開く（上書きはしない）
    const fileHandle = await app.state.dirHandle.getFileHandle(fileName, { create: true });
    log(`新規ファイル "${fileName}" を作成しました`);
    app.dom.newFileName.value = '';
    await listTextFiles(app.state.dirHandle);
    await selectLocalFile(fileHandle);
  } catch (err) {
    log(`新規ファイルの作成に失敗しました: ${err.message}`, 'error');
  }
}

// 拡張子が無ければ .txt を補う
function normalizeFileName(name) {
  return /\.[a-zA-Z0-9]+$/.test(name) ? name : `${name}.txt`;
}

// ── ファイル編集・保存 ──────────────────────

// 選択したローカルファイルを読み込みエディタに表示する
async function selectLocalFile(fileHandle) {
  try {
    app.state.currentFileHandle = fileHandle;
    app.state.currentFileName = fileHandle.name;
    app.dom.editorSection.hidden = false;
    app.dom.currentFileName.textContent = fileHandle.name;

    const file = await fileHandle.getFile();
    const text = await file.text();
    app.dom.editorArea.value = text;

    await updatePermissionBadge(fileHandle);
    log(`"${fileHandle.name}" を読み込みました（${file.size} bytes）`);
  } catch (err) {
    log(`ファイルの読み込みに失敗しました: ${err.message}`, 'error');
  }
}

// 現在の読み書き権限状態をバッジに反映する
async function updatePermissionBadge(handle) {
  const perm = await handle.queryPermission({ mode: 'readwrite' });
  app.dom.permissionBadge.textContent = `書き込み権限: ${perm}`;
  app.dom.permissionBadge.dataset.state = perm;
}

// readwrite権限を持っているか確認し、なければユーザーに許可を求める
async function ensureReadWritePermission(handle) {
  const opts = { mode: 'readwrite' };
  let perm = await handle.queryPermission(opts);
  if (perm === 'granted') return true;
  perm = await handle.requestPermission(opts); // ここでブラウザの許可ダイアログが出る
  return perm === 'granted';
}

// エディタの内容でローカルファイルを直接上書き保存する
async function overwriteLocalFile() {
  if (!app.state.currentFileHandle) {
    log('ファイルが選択されていません', 'error');
    return;
  }
  try {
    const granted = await ensureReadWritePermission(app.state.currentFileHandle);
    if (!granted) {
      log('書き込み権限が許可されませんでした', 'error');
      await updatePermissionBadge(app.state.currentFileHandle);
      return;
    }
    const writable = await app.state.currentFileHandle.createWritable();
    await writable.write(app.dom.editorArea.value);
    await writable.close();
    await updatePermissionBadge(app.state.currentFileHandle);
    log(`"${app.state.currentFileName}" にローカル上書き保存しました`);
  } catch (err) {
    log(`上書き保存に失敗しました: ${err.message}`, 'error');
  }
}

// ローカルファイルを再読込し、エディタ内の未保存の変更を破棄する
async function reloadCurrentFile() {
  if (!app.state.currentFileHandle) {
    log('ファイルが選択されていません', 'error');
    return;
  }
  const file = await app.state.currentFileHandle.getFile();
  app.dom.editorArea.value = await file.text();
  log(`"${app.state.currentFileName}" を再読込しました（編集内容は破棄されました）`);
}

// ── ログ出力 ──────────────────────

function log(message, type = 'info') {
  const time = new Date().toLocaleTimeString('ja-JP');
  const prefix = type === 'error' ? '❌' : '✅';
  app.dom.logOutput.textContent += `[${time}] ${prefix} ${message}\n`;
  app.dom.logOutput.scrollTop = app.dom.logOutput.scrollHeight;
}