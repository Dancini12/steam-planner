import React from "react";

export default class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ERRO CAPTURADO:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "white" }}>
          <h2>Erro na aplicação</h2>
          <pre>{this.state.error?.stack || this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
