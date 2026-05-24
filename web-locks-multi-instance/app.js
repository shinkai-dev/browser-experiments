const LOCK_KEY = `single_instance_lock_${location.pathname}`;
const CHANNEL_NAME = 'instance_channel';

async function setupMultiTabControl() {
  const channel = new BroadcastChannel(CHANNEL_NAME);

  // タブを閉じるときにクリーンアップ
  window.addEventListener("beforeunload", () => {
    channel.close();
  });

  // 1. ロックの取得を試みる
  // ifAvailable: true にすることで、ロックが取れない場合に即座に null を返す
  await navigator.locks.request(LOCK_KEY, { ifAvailable: true }, async (lock) => {
    if (!lock) {
      // --- ロックが取れなかった場合（既に他のタブや別プロセスが開いている） ---
      console.warn('既に他のプロセスで開かれています。');

      // 既存のメイン画面に対してアクティブになるよう通知
      channel.postMessage({ type: 'REQUEST_FOCUS' });

      // 自分（2つ目の画面）は閉じるか、警告画面を出す（本コードでは警告画面）
      // innerHTML を使わず安全に DOM を構築
      const wrapper = document.createElement("div");
      wrapper.style.padding = "20px";
      wrapper.style.textAlign = "center";

      const h1 = document.createElement("h1");
      h1.textContent = "この画面は既に別のタブ、または別ウィンドウで開かれています。";

      const p = document.createElement("p");
      p.textContent = "既存の画面をご確認ください。";

      wrapper.appendChild(h1);
      wrapper.appendChild(p);

      document.body.innerHTML = "";
      document.body.appendChild(wrapper);

      return;
    }

    // --- ロックが取れた場合（メインインスタンス） ---
    console.log('メインインスタンスとして起動しました。');

    // 後続の別タブ・別ウィンドウからのメッセージを待機
    channel.onmessage = (event) => {
      if (event.data.type === 'REQUEST_FOCUS') {
        // window.focus() はブラウザ制限により必ずしも効かない
        window.focus();
        console.log('別タブからの通知を受信しました（フォーカス要求）');
      }
    };
    // アプリのメイン処理が続く限りロックは保持される
    // （永遠に終わらない Promise でイベントループを塞ぐのは避ける）
    await new Promise(() => {});
  });
}

setupMultiTabControl();
