export class StoreNameGenerator {

  static generate(seed: number = Date.now()): string {
    return `${seed}DummyTestStore`;
  }

}