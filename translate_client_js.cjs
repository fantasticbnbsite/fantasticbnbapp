const fs = require('fs');
let content = fs.readFileSync('client.js', 'utf-8');

const replacements = [
  ["'A data deve ser hoje ou no futuro.'", "'The date must be today or in the future.'"],
  ["'A nova senha deve ter no minimo 6 caracteres'", "'The new password must be at least 6 characters'"],
  ["'A nova senha e a confirmacao nao coincidem'", "'The new password and confirmation do not match'"],
  ["'Acesso permitido apenas para clientes.'", "'Access restricted to clients only.'"],
  ["'Cancelado'", "'Cancelled'"],
  ["'Cobrança por hora'", "'Hourly billing'"],
  ["'Concluído'", "'Completed'"],
  ["'Confirmado'", "'Confirmed'"],
  ["'Desconhecido'", "'Unknown'"],
  ["'Deseja excluir este serviço da sua lista? Esta ação não pode ser desfeita.'", "'Do you want to delete this service from your list? This action cannot be undone.'"],
  ["'Deseja realmente cancelar esta solicitação de serviço?'", "'Are you sure you want to cancel this service request?'"],
  ["'E-mail ou senha incorretos.'", "'Incorrect email or password.'"],
  ["'Em andamento'", "'In progress'"],
  ["'Entrando…'", "'Logging in…'"],
  ["'Erro ao cancelar: '", "'Error cancelling: '"],
  ["'Erro ao carregar fotos.'", "'Error loading photos.'"],
  ["'Erro ao excluir: '", "'Error deleting: '"],
  ["'Erro ao fazer login. Tente novamente.'", "'Error logging in. Please try again.'"],
  ["'Erro ao solicitar limpeza. Tente novamente.'", "'Error requesting clean. Please try again.'"],
  ["'Erro ao solicitar limpeza.'", "'Error requesting clean.'"],
  ["'Erro ao trocar senha'", "'Error changing password'"],
  ["'Erro desconhecido'", "'Unknown error'"],
  ["'Limpeza'", "'Clean'"],
  ["'Não foi possível buscar as limpezas.'", "'Could not fetch cleans.'"],
  ["'Pendente'", "'Pending'"],
  ["'Preencha e-mail e senha.'", "'Enter email and password.'"],
  ["'Profissional designado'", "'Cleaner assigned'"],
  ["'Projeto fixo'", "'Fixed project'"],
  ["'Salvando...'", "'Saving...'"],
  ["'Salvar Senha'", "'Save Password'"],
  ["'Selecione um imóvel.'", "'Select a property.'"],
  ["'Selecione uma data.'", "'Select a date.'"],
  ["'Sem data'", "'No date'"],
  ["'Senha alterada com sucesso!'", "'Password changed successfully!'"],
  ["'Serviço cancelado com sucesso.'", "'Service cancelled successfully.'"],
  ["'Serviço excluído com sucesso.'", "'Service deleted successfully.'"],
  ["'⏱ Por hora'", "'⏱ Hourly'"],
  ["'📋 Projeto fixo'", "'📋 Fixed project'"],
  ["'✅ Limpeza solicitada com sucesso!'", "'✅ Clean requested successfully!'"],
  ["'pt-BR'", "'en-GB'"],
  ["'Foto da limpeza'", "'Clean photo'"],
  ["'Endereço não informado'", "'Address not provided'"],
  ['<option value="">Selecione um imóvel…</option>', '<option value="">Select a property…</option>'],
  ["'<span>⏳</span> Solicitando…'", "'<span>⏳</span> Requesting…'"],
  ["'<span>🧹</span> Solicitar Limpeza'", "'<span>🧹</span> Request Clean'"],
  ["'Entrar'", "'Log In'"],
  ["'A carregar faturas...'", "'Loading invoices...'"]
];

for (const [pt, en] of replacements) {
  content = content.replaceAll(pt, en);
}

fs.writeFileSync('client.js', content);
console.log('client.js translated');
