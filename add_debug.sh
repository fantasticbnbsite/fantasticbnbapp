for file in script.js client.js employee.js; do
cat << 'INNEREOF' >> $file

// DEBUG BUTTON
(function() {
  const btn = document.createElement('button');
  btn.textContent = '🛠️ TESTAR NOTIFICAÇÕES';
  btn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:10000;padding:10px;background:red;color:white;font-weight:bold;';
  btn.onclick = async () => {
    try {
      if (!('serviceWorker' in navigator)) return alert('No serviceWorker');
      if (!('PushManager' in window)) return alert('No PushManager. (Use a Tela de Início no iPhone!)');
      
      const perm = await Notification.requestPermission();
      alert('Permission: ' + perm);
      if (perm !== 'granted') return;
      
      const reg = await navigator.serviceWorker.register('/sw.js');
      alert('SW state: ' + (reg.active ? 'active' : 'installing/waiting'));
      
      await navigator.serviceWorker.ready;
      alert('SW ready!');
      
      let sub = await reg.pushManager.getSubscription();
      alert('Existing sub: ' + (sub ? 'yes' : 'no'));
      
      if (!sub) {
        const res = await fetch('/api/push/vapidPublicKey').then(r=>r.json());
        const padding = '='.repeat((4 - res.publicKey.length % 4) % 4);
        const base64 = (res.publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });
        alert('Created new sub!');
      }
      
      const postRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });
      alert('Server response: ' + postRes.status);
    } catch(e) {
      alert('ERROR: ' + e.message);
    }
  };
  document.body.appendChild(btn);
})();
INNEREOF
done
