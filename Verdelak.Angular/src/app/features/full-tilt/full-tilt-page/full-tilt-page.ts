import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Knight {
  id: number;
  name: string;
  virtue: string;
  favours: number;
  score: number;
  injuries: number;
  active: boolean;
}

interface Player {
  id: 1 | 2;
  name: string;
  knights: Knight[];
  selectedKnightId: number;
}

interface TiltLogEntry {
  id: number;
  createdAt: string;
  text: string;
}

interface PassResult {
  id: number;
  passNumber: number;
  playerOneKnight: string;
  playerTwoKnight: string;
  playerOneRoll: number | null;
  playerTwoRoll: number | null;
  winner: 1 | 2 | null;
  winnerKnightId?: number | null;
  outcome: string;
  pointsAwarded: number;
  notes: string;
  createdAt: string;
}

interface FullTiltState {
  players: Player[];
  matchName?: string;
  targetScore?: number;
  maxPasses?: number;
  passNumber: number;
  currentPlayer: 1 | 2;
  log: TiltLogEntry[];
  passResults?: PassResult[];
  playerOneRoll?: number | null;
  playerTwoRoll?: number | null;
  passOutcome?: string;
  passPoints?: number;
  passNotes?: string;
}

const storageKey = 'verdelak.fullTilt.phase1';
const officialRulesUrl = 'https://assets.warhammer-community.com/warhammertheoldworld_miscellaneous_fulltilt_eng_24.09-z9ezhwj6lo.pdf';

@Component({
  selector: 'app-full-tilt-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './full-tilt-page.html',
  styleUrl: './full-tilt-page.scss'
})
export class FullTiltPage implements OnInit {
  readonly rulesUrl = officialRulesUrl;
  readonly players = signal<Player[]>(this.defaultPlayers());
  readonly matchName = signal('Local Joust');
  readonly targetScore = signal(5);
  readonly maxPasses = signal(12);
  readonly passNumber = signal(1);
  readonly currentPlayer = signal<1 | 2>(1);
  readonly log = signal<TiltLogEntry[]>([]);
  readonly logText = signal('');
  readonly passResults = signal<PassResult[]>([]);
  readonly playerOneRoll = signal<number | null>(null);
  readonly playerTwoRoll = signal<number | null>(null);
  readonly passOutcome = signal('Clean pass');
  readonly passPoints = signal(1);
  readonly passNotes = signal('');

  readonly passOutcomes = [
    'Clean pass',
    'Broken lance',
    'Glancing hit',
    'No telling blow',
    'Unhorsed',
    'Injury',
    'Custom'
  ];

  readonly playerOne = computed(() => this.players()[0]);
  readonly playerTwo = computed(() => this.players()[1]);
  readonly activePlayer = computed(() => this.players().find(player => player.id === this.currentPlayer()) ?? this.players()[0]);
  readonly activeOpponent = computed(() => this.players().find(player => player.id !== this.currentPlayer()) ?? this.players()[1]);
  readonly passWinner = computed<1 | 2 | null>(() => {
    const one = this.playerOneRoll();
    const two = this.playerTwoRoll();
    if (one === null || two === null || one === two) {
      return null;
    }

    return one > two ? 1 : 2;
  });
  readonly passSummary = computed(() => {
    const one = this.playerOneRoll();
    const two = this.playerTwoRoll();
    if (one === null || two === null) {
      return 'Enter both roll totals to preview the pass winner.';
    }

    if (one === two) {
      return 'The pass is tied. Resolve it manually or record it with no winner.';
    }

    const winner = one > two ? this.playerOne() : this.playerTwo();
    const margin = Math.abs(one - two);
    return `${winner.name} is ahead by ${margin}.`;
  });
  readonly matchStatus = computed(() => {
    const scores = this.players().map(player => ({
      id: player.id,
      name: player.name || `Player ${player.id}`,
      score: this.playerScore(player)
    }));
    const topScore = Math.max(...scores.map(score => score.score));
    const leaders = scores.filter(score => score.score === topScore);
    const target = this.targetScore();
    const maxPasses = this.maxPasses();

    if (target > 0 && topScore >= target && leaders.length === 1) {
      return `${leaders[0].name} has reached ${target} points.`;
    }

    if (maxPasses > 0 && this.passNumber() > maxPasses) {
      if (leaders.length === 1) {
        return `${leaders[0].name} leads after ${maxPasses} passes.`;
      }

      return `Tied after ${maxPasses} passes.`;
    }

    const remainingToTarget = target > 0 ? Math.max(0, target - topScore) : null;
    const remainingPasses = maxPasses > 0 ? Math.max(0, maxPasses - this.passNumber() + 1) : null;
    const parts = [];
    if (remainingToTarget !== null) {
      parts.push(`${remainingToTarget} point${remainingToTarget === 1 ? '' : 's'} to target`);
    }
    if (remainingPasses !== null) {
      parts.push(`${remainingPasses} pass${remainingPasses === 1 ? '' : 'es'} remaining`);
    }

    return parts.length ? parts.join(' - ') : 'Open-ended match';
  });
  readonly leaderText = computed(() => {
    const totals = this.players().map(player => ({
      name: player.name || `Player ${player.id}`,
      score: this.playerScore(player)
    }));

    if (totals[0].score === totals[1].score) {
      return `Tied at ${totals[0].score}`;
    }

    const leader = totals[0].score > totals[1].score ? totals[0] : totals[1];
    return `${leader.name} leads by ${Math.abs(totals[0].score - totals[1].score)}`;
  });

  ngOnInit(): void {
    this.load();
  }

  setMatchName(name: string): void {
    this.matchName.set(name);
    this.save();
  }

  setTargetScore(value: string | number): void {
    const target = Number(value);
    this.targetScore.set(Number.isNaN(target) ? 0 : Math.max(0, target));
    this.save();
  }

  setMaxPasses(value: string | number): void {
    const maxPasses = Number(value);
    this.maxPasses.set(Number.isNaN(maxPasses) ? 0 : Math.max(0, maxPasses));
    this.save();
  }

  setPlayerName(playerId: 1 | 2, name: string): void {
    this.updatePlayer(playerId, player => ({ ...player, name }));
  }

  selectKnight(playerId: 1 | 2, knightId: number): void {
    this.updatePlayer(playerId, player => ({ ...player, selectedKnightId: knightId }));
  }

  setKnightField<K extends keyof Knight>(playerId: 1 | 2, knightId: number, field: K, value: Knight[K]): void {
    this.updateKnight(playerId, knightId, knight => ({ ...knight, [field]: value }));
  }

  adjustKnight(playerId: 1 | 2, knightId: number, field: 'favours' | 'score' | 'injuries', amount: number): void {
    this.updateKnight(playerId, knightId, knight => ({
      ...knight,
      [field]: Math.max(0, Number(knight[field] ?? 0) + amount)
    }));
  }

  addKnight(playerId: 1 | 2): void {
    this.updatePlayer(playerId, player => {
      const nextId = Math.max(...player.knights.map(knight => knight.id), 0) + 1;
      const knight: Knight = {
        id: nextId,
        name: `Knight ${nextId}`,
        virtue: '',
        favours: 0,
        score: 0,
        injuries: 0,
        active: true
      };

      return {
        ...player,
        selectedKnightId: knight.id,
        knights: [...player.knights, knight]
      };
    });
    this.addLog(`${this.playerName(playerId)} added a knight.`);
  }

  removeKnight(playerId: 1 | 2, knightId: number): void {
    this.updatePlayer(playerId, player => {
      if (player.knights.length <= 1) {
        return player;
      }

      const knights = player.knights.filter(knight => knight.id !== knightId);
      return {
        ...player,
        knights,
        selectedKnightId: knights[0].id
      };
    });
  }

  selectedKnight(player: Player): Knight {
    return player.knights.find(knight => knight.id === player.selectedKnightId) ?? player.knights[0];
  }

  recordResult(result: string, points = 0): void {
    const player = this.activePlayer();
    const knight = this.selectedKnight(player);
    this.adjustKnight(player.id, knight.id, 'score', points);
    this.addLog(`${player.name}: ${knight.name} - ${result}${points ? ` (+${points})` : ''}.`);
  }

  spendFavour(): void {
    const player = this.activePlayer();
    const knight = this.selectedKnight(player);
    if (knight.favours <= 0) {
      this.addLog(`${player.name}: ${knight.name} has no favours to spend.`);
      return;
    }

    this.adjustKnight(player.id, knight.id, 'favours', -1);
    this.addLog(`${player.name}: ${knight.name} spent a favour.`);
  }

  addInjury(): void {
    const player = this.activePlayer();
    const knight = this.selectedKnight(player);
    this.adjustKnight(player.id, knight.id, 'injuries', 1);
    this.addLog(`${player.name}: ${knight.name} took an injury.`);
  }

  toggleActivePlayer(): void {
    this.currentPlayer.set(this.currentPlayer() === 1 ? 2 : 1);
    this.save();
  }

  nextPass(): void {
    this.passNumber.set(this.passNumber() + 1);
    this.currentPlayer.set(this.currentPlayer() === 1 ? 2 : 1);
    this.clearPassEntry(false);
    this.addLog(`Pass ${this.passNumber()} begins.`);
  }

  setRoll(playerId: 1 | 2, value: string | number | null): void {
    const parsed = value === null || value === '' ? null : Number(value);
    const roll = parsed === null || Number.isNaN(parsed) ? null : Math.max(0, parsed);
    if (playerId === 1) {
      this.playerOneRoll.set(roll);
    } else {
      this.playerTwoRoll.set(roll);
    }
    this.save();
  }

  adjustRoll(playerId: 1 | 2, amount: number): void {
    const current = playerId === 1 ? this.playerOneRoll() : this.playerTwoRoll();
    this.setRoll(playerId, Math.max(0, (current ?? 0) + amount));
  }

  rollDie(playerId: 1 | 2): void {
    this.setRoll(playerId, Math.floor(Math.random() * 6) + 1);
  }

  setPassOutcome(outcome: string): void {
    this.passOutcome.set(outcome);
    this.save();
  }

  setPassPoints(value: string | number): void {
    const points = Number(value);
    this.passPoints.set(Number.isNaN(points) ? 0 : Math.max(0, points));
    this.save();
  }

  recordGuidedPass(): void {
    const winner = this.passWinner();
    const winnerPlayer = winner ? this.players().find(player => player.id === winner) : null;
    const winnerKnight = winnerPlayer ? this.selectedKnight(winnerPlayer) : null;
    const points = this.passPoints();
    const notes = this.passNotes().trim();
    const result: PassResult = {
      id: Date.now(),
      passNumber: this.passNumber(),
      playerOneKnight: this.selectedKnight(this.playerOne()).name,
      playerTwoKnight: this.selectedKnight(this.playerTwo()).name,
      playerOneRoll: this.playerOneRoll(),
      playerTwoRoll: this.playerTwoRoll(),
      winner,
      winnerKnightId: winnerKnight?.id ?? null,
      outcome: this.passOutcome(),
      pointsAwarded: winner ? points : 0,
      notes,
      createdAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };

    if (winnerPlayer && winnerKnight && points > 0) {
      this.adjustKnight(winnerPlayer.id, winnerKnight.id, 'score', points);
    }

    this.passResults.set([result, ...this.passResults()]);
    this.addLog(this.passResultText(result));
    this.passNumber.set(this.passNumber() + 1);
    this.currentPlayer.set(this.currentPlayer() === 1 ? 2 : 1);
    this.clearPassEntry(false);
    this.save();
  }

  undoLastGuidedPass(): void {
    const [lastPass, ...remainingPasses] = this.passResults();
    if (!lastPass) {
      return;
    }

    if (lastPass.winner && lastPass.winnerKnightId && lastPass.pointsAwarded > 0) {
      this.adjustKnight(lastPass.winner, lastPass.winnerKnightId, 'score', -lastPass.pointsAwarded);
    }

    this.passResults.set(remainingPasses);
    this.passNumber.set(Math.max(1, lastPass.passNumber));
    this.currentPlayer.set(lastPass.winner === 2 ? 2 : 1);
    this.addLog(`Undid guided pass ${lastPass.passNumber}.`);
    this.save();
  }

  clearPassEntry(shouldSave = true): void {
    this.playerOneRoll.set(null);
    this.playerTwoRoll.set(null);
    this.passOutcome.set('Clean pass');
    this.passPoints.set(1);
    this.passNotes.set('');
    if (shouldSave) {
      this.save();
    }
  }

  addCustomLog(): void {
    const text = this.logText().trim();
    if (!text) {
      return;
    }

    this.addLog(text);
    this.logText.set('');
  }

  resetMatch(): void {
    if (!window.confirm('Reset this Full Tilt match?')) {
      return;
    }

    this.players.set(this.defaultPlayers());
    this.matchName.set('Local Joust');
    this.targetScore.set(5);
    this.maxPasses.set(12);
    this.passNumber.set(1);
    this.currentPlayer.set(1);
    this.log.set([]);
    this.passResults.set([]);
    this.clearPassEntry(false);
    this.save();
  }

  playerScore(player: Player): number {
    return player.knights.reduce((sum, knight) => sum + knight.score, 0);
  }

  private load(): void {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      this.save();
      return;
    }

    try {
      const state = JSON.parse(raw) as FullTiltState;
      this.players.set(state.players?.length === 2 ? state.players : this.defaultPlayers());
      this.matchName.set(state.matchName ?? 'Local Joust');
      this.targetScore.set(state.targetScore ?? 5);
      this.maxPasses.set(state.maxPasses ?? 12);
      this.passNumber.set(state.passNumber || 1);
      this.currentPlayer.set(state.currentPlayer === 2 ? 2 : 1);
      this.log.set(state.log ?? []);
      this.passResults.set(state.passResults ?? []);
      this.playerOneRoll.set(state.playerOneRoll ?? null);
      this.playerTwoRoll.set(state.playerTwoRoll ?? null);
      this.passOutcome.set(state.passOutcome ?? 'Clean pass');
      this.passPoints.set(state.passPoints ?? 1);
      this.passNotes.set(state.passNotes ?? '');
    } catch {
      localStorage.removeItem(storageKey);
      this.save();
    }
  }

  private save(): void {
    const state: FullTiltState = {
      players: this.players(),
      matchName: this.matchName(),
      targetScore: this.targetScore(),
      maxPasses: this.maxPasses(),
      passNumber: this.passNumber(),
      currentPlayer: this.currentPlayer(),
      log: this.log(),
      passResults: this.passResults(),
      playerOneRoll: this.playerOneRoll(),
      playerTwoRoll: this.playerTwoRoll(),
      passOutcome: this.passOutcome(),
      passPoints: this.passPoints(),
      passNotes: this.passNotes()
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  private updatePlayer(playerId: 1 | 2, update: (player: Player) => Player): void {
    this.players.set(this.players().map(player => player.id === playerId ? update(player) : player));
    this.save();
  }

  private updateKnight(playerId: 1 | 2, knightId: number, update: (knight: Knight) => Knight): void {
    this.updatePlayer(playerId, player => ({
      ...player,
      knights: player.knights.map(knight => knight.id === knightId ? update(knight) : knight)
    }));
  }

  private addLog(text: string): void {
    this.log.set([
      {
        id: Date.now(),
        createdAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        text
      },
      ...this.log()
    ]);
    this.save();
  }

  private passResultText(result: PassResult): string {
    const winner = result.winner ? this.players().find(player => player.id === result.winner) : null;
    const rollText = `rolls ${result.playerOneRoll ?? '-'} to ${result.playerTwoRoll ?? '-'}`;
    const winnerText = winner ? `${winner.name} wins` : 'No winner';
    const pointText = result.pointsAwarded ? ` and gains ${result.pointsAwarded} point${result.pointsAwarded === 1 ? '' : 's'}` : '';
    const noteText = result.notes ? ` Notes: ${result.notes}` : '';
    return `Pass ${result.passNumber}: ${winnerText} (${rollText}) - ${result.outcome}${pointText}.${noteText}`;
  }

  private playerName(playerId: 1 | 2): string {
    return this.players().find(player => player.id === playerId)?.name ?? `Player ${playerId}`;
  }

  private defaultPlayers(): Player[] {
    return [
      {
        id: 1,
        name: 'Player 1',
        selectedKnightId: 1,
        knights: this.defaultKnights()
      },
      {
        id: 2,
        name: 'Player 2',
        selectedKnightId: 1,
        knights: this.defaultKnights()
      }
    ];
  }

  private defaultKnights(): Knight[] {
    return [1, 2, 3].map(id => ({
      id,
      name: `Knight ${id}`,
      virtue: '',
      favours: 0,
      score: 0,
      injuries: 0,
      active: true
    }));
  }
}
