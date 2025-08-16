function formatLog(typeId: string, label: string) {
    switch (typeId) {
      case "data-source":
        return `Data Source “${label}” processed 100 records`;
      case "transformer":
        return `Transformer “${label}” applied`;
      case "model":
        return `Model “${label}” generated predictions`;
      case "sink":
        return `Sink “${label}” saved results`;
      default:
        return `Node “${label}” completed`;
    }
  }