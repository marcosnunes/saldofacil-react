export default function TransactionCard({
  transaction,
  runningBalance,
  onEdit,
  onDelete
}) {
  const isCredit = parseFloat(transaction.credit) > 0;
  const amount = isCredit ? parseFloat(transaction.credit) : parseFloat(transaction.debit);
  const amountClass = isCredit ? 'credit' : 'debit';
  const icon = isCredit ? 'arrow_upward' : 'arrow_downward';

  // Limita a descrição principal e usa a completa para detalhes
  const mainDescription = transaction.description.split(' - ')[0];
  const fullDescription = transaction.description;

  return (
    <div className="transaction-v2" data-id={transaction.id}>
      <div className={`transaction-v2-left ${amountClass}`}>
        <i className="material-icons">{icon}</i>
        <span className="transaction-day">{transaction.day}</span>
      </div>

      <div className="transaction-v2-center">
        <span className="transaction-description">{mainDescription}</span>
        <span className="transaction-full-description">{fullDescription}</span>
        <span className="transaction-balance-value">
          Saldo do dia: R$ {runningBalance.toFixed(2)}
        </span>
      </div>

      <div className="transaction-v2-right">
        <span className={`transaction-amount ${amountClass}`}>
          R$ {amount.toFixed(2)}
        </span>
        <div className="transaction-actions">
          <button className="btn-icon" onClick={() => onEdit(transaction.id)}>
            <i className="material-icons">edit</i>
          </button>
          <button className="btn-icon" onClick={() => onDelete(transaction.id)}>
            <i className="material-icons">delete</i>
          </button>
        </div>
      </div>
    </div>
  );
}
