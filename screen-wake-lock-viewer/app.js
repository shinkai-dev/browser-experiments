// Screen Wake Lock API の対応チェック・取得・解放を検証する実験用スクリプト

// 名前空間オブジェクトにまとめてグローバル汚染を防ぐ
const app = {
  wakeLockSentinel: null, // 現在保持している WakeLockSentinel オブジェクト
  elements: {},           // よく使う DOM 要素の参照をまとめておく
};

document.addEventListener('DOMContentLoaded', () => {
  // DOM要素を取得しておく
  app.elements = {
    supportStatus: document.getElementById('support-status'),
    lockStatus: document.getElementById('lock-status'),
    btnRequest: document.getElementById('btn-request'),
    btnRelease: document.getElementById('btn-release'),
    logList: document.getElementById('log-list'),
  };

  checkApiSupport();

  app.elements.btnRequest.addEventListener('click', requestWakeLock);
  app.elements.btnRelease.addEventListener('click', releaseWakeLock);
});

// Screen Wake Lock API がこのブラウザで利用可能かを確認する
function checkApiSupport() {
  const isSupported = 'wakeLock' in navigator;

  if (isSupported) {
    app.elements.supportStatus.textContent = '対応しています（navigator.wakeLock が利用可能）';
    app.elements.supportStatus.classList.add('swl-status-ok');
  } else {
    app.elements.supportStatus.textContent = '非対応です（navigator.wakeLock が見つかりません）';
    app.elements.supportStatus.classList.add('swl-status-ng');
    app.elements.btnRequest.disabled = true;
    addLog('この環境では Screen Wake Lock API が利用できません。');
  }
}

// Wake Lock を取得する
async function requestWakeLock() {
  try {
    // 'screen' のみが現在サポートされているタイプ
    app.wakeLockSentinel = await navigator.wakeLock.request('screen');
    updateLockStatus(true);
    addLog('Wake Lock を取得しました。');

    // ブラウザ側の都合（タブ非表示など）で自動解放された場合のイベント
    app.wakeLockSentinel.addEventListener('release', () => {
      addLog('Wake Lock がブラウザによって解放されました（release イベント）。');
      updateLockStatus(false);
    });
  } catch (error) {
    // 権限拒否やタブが非表示の場合などにエラーになることがある
    addLog(`Wake Lock の取得に失敗しました: ${error.name} - ${error.message}`);
  }
}

// Wake Lock を明示的に解放する
async function releaseWakeLock() {
  if (!app.wakeLockSentinel) {
    addLog('解放対象の Wake Lock がありません。');
    return;
  }

  try {
    await app.wakeLockSentinel.release();
    app.wakeLockSentinel = null;
    updateLockStatus(false);
    addLog('Wake Lock を手動で解放しました。');
  } catch (error) {
    addLog(`Wake Lock の解放に失敗しました: ${error.name} - ${error.message}`);
  }
}

// 画面上の状態表示とボタンの活性/非活性を更新する
function updateLockStatus(isLocked) {
  app.elements.lockStatus.textContent = `現在の状態: ${isLocked ? '取得中' : '未取得'}`;
  app.elements.btnRequest.disabled = isLocked;
  app.elements.btnRelease.disabled = !isLocked;
}

// 操作ログをリストに追加する
function addLog(message) {
  const now = new Date().toLocaleTimeString('ja-JP');
  const li = document.createElement('li');
  li.textContent = `[${now}] ${message}`;
  app.elements.logList.prepend(li);
}
