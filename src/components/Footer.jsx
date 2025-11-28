export default function Footer() {
  return (
    <footer className="page-footer">
      <div className="container">
        <p className="custom-flow-text">
          "O sucesso é a soma de pequenos esforços repetidos diariamente" - Robert Collier
        </p>
        <div className="divider"></div>
        <p className="grey-text">
          © {new Date().getFullYear()} Saldo Fácil. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
