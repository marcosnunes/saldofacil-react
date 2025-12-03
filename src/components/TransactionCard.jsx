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

  return (
    <div className="transaction-v2" data-id={transaction.id}>
      <div className={`transaction-v2-left ${amountClass}`}>
        <i className="material-icons">{icon}</i>
        <span className="transaction-day">{transaction.day}</span>
      </div>

      <div className="transaction-v2-center">
        <span className="transaction-description">{transaction.description}</span>
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
