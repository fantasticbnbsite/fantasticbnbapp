async function translate(text) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=' + encodeURIComponent(text);
  const res = await fetch(url);
  const data = await res.json();
  return data[0][0][0];
}

translate('Varrer debaixo da cama (FOTO)').then(console.log);
translate('Limpar o microondas').then(console.log);
translate('Tirar o lixo').then(console.log);
