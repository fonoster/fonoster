export class Storage {
  public constructor(private readonly key: string) {}

  public get() {
    if (typeof window === 'undefined') return

    return localStorage.getItem(this.key)
  }

  public destroy(): void {
    if (typeof window === 'undefined') return

    localStorage.removeItem(this.key)
  }

  public set(value: string) {
    if (typeof window === 'undefined') return

    localStorage.setItem(this.key, value)
  }
}
