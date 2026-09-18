self.addEventListener('push',event=>{
  let data={title:'Blindbandit',body:'New notification',deep_link:'/mobile/'};
  try{if(event.data)data={...data,...event.data.json()};}catch{}
  event.waitUntil(self.registration.showNotification(data.title||'Blindbandit',{body:data.body||'',data:{url:data.deep_link||'/mobile/'},icon:'/assets/app-icon-gold-black-v1.jpg',badge:'/assets/app-icon-gold-black-v1.jpg'}));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=(event.notification.data&&event.notification.data.url)||'/mobile/';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if(c.url.includes('/mobile')&&'focus' in c){c.navigate(url);return c.focus();}}if(clients.openWindow)return clients.openWindow(url);}));
});
