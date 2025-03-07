import { Invoice, Play, Plays, Performance, EnrichPerformance, Statement } from '../types';

/**
 * statement에 필요한 데이터를 처리한다.
 *
 * @param invoice
 * @param plays
 * @returns
 */
export function createStatementData(invoice: Invoice, plays: Plays) {
  const result: Statement = {} as Statement;
  result.customer = invoice.customer;
  result.performances = invoice.performances.map(enrichPerformance);
  result.totalAmount = totalAmount(result);
  result.totalVolumeCredits = totalVolumeCredits(result);
  return result;

  /**
   * 공연 정보를 추가한다.
   *
   * @param performance
   * @returns
   */
  function enrichPerformance(performance: Performance): EnrichPerformance {
    const calculator = createPerformanceCalculator(performance, playFor(performance));
    const result = Object.assign({}, performance) as EnrichPerformance;
    result.play = calculator.play;
    result.amount = calculator.amount;
    result.volumeCredits = calculator.volumeCredits;

    return result;
  }

  /**
   * performance를 통해 play 값을 구한다.
   *
   * @param performance
   * @returns
   */
  function playFor(performance: Performance): Play {
    return plays[performance.playID];
  }

  /**
   * totalAmount를 구한다.
   *
   * @returns
   */
  function totalAmount(data: Statement) {
    return data.performances.reduce((total, p) => total + p.amount, 0);
  }

  /**
   * volumeCredites를 구한다.
   *
   * @returns
   */
  function totalVolumeCredits(data: Statement) {
    return data.performances.reduce((total, p) => total + p.volumeCredits, 0);
  }
}

/**
 * 공연 관련 데이터 계산 함수를 담당하는 클래스
 */
class PerformanceCalculator {
  constructor(performance: Performance, play: Play) {
    this.performance = performance;
    this.play = play;
  }

  performance: Performance;
  play: Play;

  public get amount(): number {
    throw new Error('서브 클래스에서 처리하도록 설계 되었습니다.');
  }

  public get volumeCredits(): number {
    return Math.max(this.performance.audience - 30, 0);
  }
}

/**
 * PerformanceCalculator에 대한 팩터리 함수
 *
 * @param performance
 * @param play
 * @returns
 */
function createPerformanceCalculator(performance: Performance, play: Play) {
  switch (play.type) {
    case 'tragedy':
      return new TragedyCalculator(performance, play);
    case 'comedy':
      return new ComedyCalculator(performance, play);
    default:
      throw new Error(`알 수 없는 장르: ${play.type}`);
  }
}

/**
 * 비극 공연 관련 데이터 계산 함수를 담당하는 클래스
 */
class TragedyCalculator extends PerformanceCalculator {
  public get amount(): number {
    let result = 40000;
    if (this.performance.audience > 30) {
      result += 1000 * (this.performance.audience - 30);
    }

    return result;
  }
}

/**
 * 희극 공연 관련 데이터 계산 함수를 담당하는 클래스
 */
class ComedyCalculator extends PerformanceCalculator {
  public get amount(): number {
    let result = 30000;
    if (this.performance.audience > 20) {
      result += 10000 + 500 * (this.performance.audience - 20);
    }
    result += 300 * this.performance.audience;

    return result;
  }

  public get volumeCredits(): number {
    return super.volumeCredits + Math.floor(this.performance.audience / 5);
  }
}
