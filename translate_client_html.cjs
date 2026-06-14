const fs = require('fs');
let content = fs.readFileSync('client.html', 'utf-8');

// Replace strings in client.html
const replacements = [
  ['lang="pt-BR"', 'lang="en-GB"'],
  ['Portal do Cliente', 'Client Portal'],
  ['Bem-vindo', 'Welcome'],
  ['Acesse para acompanhar suas limpezas e solicitar novos serviços.', 'Log in to track your cleans and request new services.'],
  ['E-mail', 'Email'],
  ['Senha', 'Password'],
  ['seu@email.com', 'your@email.com'],
  ['Entrar', 'Log In'],
  ['Minhas Limpezas', 'My Cleans'],
  ['Minhas Faturas', 'My Invoices'],
  ['Solicitar Limpeza', 'Request Clean'],
  ['Carregando...', 'Loading...'],
  ['Trocar Senha', 'Change Password'],
  ['Sair', 'Log Out'],
  ['Acompanhe o status das suas limpezas', 'Track the status of your cleans'],
  ['Agende uma limpeza para um dos seus imóveis', 'Schedule a clean for one of your properties'],
  ['Imóvel', 'Property'],
  ['Selecione um imóvel…', 'Select a property…'],
  ['Data da Limpeza', 'Date of Clean'],
  ['Observações <span style="font-weight:400;opacity:0.7">(opcional)</span>', 'Notes <span style="font-weight:400;opacity:0.7">(optional)</span>'],
  ['Ex: Checkin às 15h, chave no cofre 1234', 'E.g., Check-in at 3pm, key in safe 1234'],
  ['Faturas oficiais geradas e enviadas', 'Official invoices generated and sent'],
  ['A carregar faturas...', 'Loading invoices...'],
  ['Limpezas', 'Cleans'],
  ['Faturas', 'Invoices'],
  ['Solicitar', 'Request'],
  ['📸 Fotos da Limpeza', '📸 Clean Photos'],
  ['Aviso: As fotos deste serviço ficarão disponíveis no servidor por apenas 1 mês (30 dias).<br>\n      Para baixar uma foto, clique no botão "Baixar" abaixo dela.', 'Note: Photos for this service will be available on the server for only 1 month (30 days).<br>\n      To download a photo, click the "Download" button below it.'],
  ['Fotos da limpeza', 'Clean photos'],
  ['Fechar', 'Close'],
  ['Foto em tamanho real', 'Full size photo'],
  ['Fechar lightbox', 'Close lightbox'],
  ['Foto da limpeza', 'Clean photo'],
  ['Senha Atual', 'Current Password'],
  ['Nova Senha', 'New Password'],
  ['Confirmar Nova Senha', 'Confirm New Password'],
  ['Salvar Senha', 'Save Password'],
  ['Navegação desktop', 'Desktop navigation'],
  ['Navegação principal', 'Main navigation']
];

for (const [pt, en] of replacements) {
  content = content.replaceAll(pt, en);
}

fs.writeFileSync('client.html', content);
console.log('client.html translated');
