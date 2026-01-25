export default class LegendaryError extends Error {
  constructor(message: string) {
    super(message.trim());
    this.name = 'LegendaryError';
  }
}
