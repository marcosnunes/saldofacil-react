export default function TransactionCard({ 
  transaction, 
  runningBalance, 
  onEdit, 
  onDelete 
}) {
  const isCredit = parseFloat(transaction.credit) > 0;
  const amount = isCredit ? parseFloat(transaction.credit) : parseFloat(transaction.debit);
  const amountClass = isCredit ? 'credit' : 'debit';
  const amountSign = isCredit ? '+' : '-';

  return (
    <div className="transaction-card" data-id={transaction.id}>
      <div className="transaction-header">
        <span className="transaction-description">{transaction.description}</span>
        <span className="transaction-day">Dia: {transaction.day}</span>
      </div>
      <div className="transaction-body">
        <span className={`transaction-amount ${amountClass}`}>
          {amountSign} R$ {amount.toFixed(2)}
        </span>
        <div className="transaction-balance">
          <span className="transaction-balance-label">Saldo do Dia</span>
          <span className="transaction-balance-value">R$ {runningBalance.toFixed(2)}</span>
        </div>
      </div>
      <div className="transaction-actions">
        <button className="btn btn-flat" onClick={() => onEdit(transaction.id)}>
          Editar
        </button>
        <button className="btn btn-flat red-text" onClick={() => onDelete(transaction.id)}>
          Excluir
        </button>
      </div>
    </div>
  );
}
