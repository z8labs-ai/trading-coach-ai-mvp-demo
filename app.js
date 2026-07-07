const INTERVENTION_LEVELS = {
  0: { name: 'Normal', className: 'normal', action: 'No intervention needed.' },
  1: { name: 'Observation', className: 'observation', action: 'The coach is watching a behavior shift.' },
  2: { name: 'Soft Warning', className: 'warning', action: 'Slow down and confirm the next trade still fits the plan.' },
  3: { name: 'Forced Check-In', className: 'reflection', action: 'Talk through what happened before continuing.' },
  4: { name: 'Cooldown Recommended', className: 'cooldown', action: 'Pause new entries and let the emotional state reset.' },
  5: { name: 'Lockout Recommended', className: 'lockout', action: 'Stop trading for the session to protect capital.' }
};

const RISK_TIERS = {
  low: { name: 'Low Risk', dailyPercent: 1 },
  moderate: { name: 'Moderate Risk', dailyPercent: 2.5 },
  aggressive: { name: 'Aggressive Risk', dailyPercent: 5 },
  highAggressive: { name: 'High Aggressive Risk', dailyPercent: 10 }
};

const RISK_TIER_ORDER = ['low', 'moderate', 'aggressive', 'highAggressive'];

const COACH_CHECK_IN_STEPS = [
  'What happened on the last trade?',
  'Was that trade inside your plan?',
  'What is the next disciplined action?'
];

const API_BASE_URL = resolveApiBaseUrl();

const state = {
  isLive: false,
  activeAdapterName: 'SimulatorAdapter',
  auth: {
    configured: false,
    required: false,
    signedIn: false,
    localPrototypeMode: false,
    user: null,
    clerk: null
  },
  ui: {
    focus: 'overview',
    logFilter: 'all'
  },
  disciplineLock: {
    isLocked: false,
    lockedLimits: null
  },
  weeklyReview: null,
  endDayReview: null,
  api: {
    baseUrl: API_BASE_URL,
    serverOnline: false,
    openAiConfigured: false,
    projectXConfigured: false,
    projectXConnected: false,
    voiceConnected: false
  },
  plan: {
    accountCapital: 50000,
    riskTier: 'moderate',
    dailyRiskPercent: 2.5,
    marketBias: 'Bullish',
    keyZones: '4532, 4550, 4565',
    approvedSetups: ['Opening range breakout', 'Pullback to value', 'VWAP reclaim'],
    estimatedRiskPerContract: 250,
    maxDailyLoss: 1250,
    maxContracts: 2,
    maxTrades: 2,
    cooldownAfterLosses: 2,
    behaviorToAvoid: 'No revenge trading after losses. No increasing size to make money back. Only A+ setups.'
  },
  session: defaultSession()
};

const elements = {
  appShell: document.getElementById('appShell'),
  authGate: document.getElementById('authGate'),
  authGateMessage: document.getElementById('authGateMessage'),
  clerkAuthMount: document.getElementById('clerkAuthMount'),
  localPrototypeMode: document.getElementById('localPrototypeMode'),
  userProfileSlot: document.getElementById('userProfileSlot'),
  guardrailMode: document.getElementById('guardrailMode'),
  guardrailDetail: document.getElementById('guardrailDetail'),
  riskUsedText: document.getElementById('riskUsedText'),
  riskUsedMeter: document.getElementById('riskUsedMeter'),
  tradeCapacityText: document.getElementById('tradeCapacityText'),
  tradeCapacityMeter: document.getElementById('tradeCapacityMeter'),
  coachStateBadge: document.getElementById('coachStateBadge'),
  coachStateText: document.getElementById('coachStateText'),
  focusTabs: document.querySelectorAll('.focus-tabs button'),
  planForm: document.getElementById('planForm'),
  accountCapital: document.getElementById('accountCapital'),
  riskTier: document.getElementById('riskTier'),
  estimatedRiskPerContract: document.getElementById('estimatedRiskPerContract'),
  disciplineLockStatus: document.getElementById('disciplineLockStatus'),
  lockWeeklyPlan: document.getElementById('lockWeeklyPlan'),
  unlockWeeklyPlan: document.getElementById('unlockWeeklyPlan'),
  lockRulesList: document.getElementById('lockRulesList'),
  weeklyReviewStatus: document.getElementById('weeklyReviewStatus'),
  weeklyReviewRecommendation: document.getElementById('weeklyReviewRecommendation'),
  weeklyReviewList: document.getElementById('weeklyReviewList'),
  runWeeklyReview: document.getElementById('runWeeklyReview'),
  endDayReviewStatus: document.getElementById('endDayReviewStatus'),
  endDayReviewRecommendation: document.getElementById('endDayReviewRecommendation'),
  endDayReviewSummary: document.getElementById('endDayReviewSummary'),
  endDayReviewList: document.getElementById('endDayReviewList'),
  runEndDayReview: document.getElementById('runEndDayReview'),
  marketBias: document.getElementById('marketBias'),
  keyZones: document.getElementById('keyZones'),
  approvedSetups: document.getElementById('approvedSetups'),
  maxDailyLoss: document.getElementById('maxDailyLoss'),
  maxContracts: document.getElementById('maxContracts'),
  maxTrades: document.getElementById('maxTrades'),
  cooldownAfterLosses: document.getElementById('cooldownAfterLosses'),
  behaviorToAvoid: document.getElementById('behaviorToAvoid'),
  sessionStatus: document.getElementById('sessionStatus'),
  clock: document.getElementById('clock'),
  dailyPnl: document.getElementById('dailyPnl'),
  positionSize: document.getElementById('positionSize'),
  tradeCount: document.getElementById('tradeCount'),
  lossStreak: document.getElementById('lossStreak'),
  riskCard: document.getElementById('riskCard'),
  riskLevel: document.getElementById('riskLevel'),
  riskSummary: document.getElementById('riskSummary'),
  interventionStatus: document.getElementById('interventionStatus'),
  interventionName: document.getElementById('interventionName'),
  interventionAction: document.getElementById('interventionAction'),
  riskRadar: document.getElementById('riskRadar'),
  riskScore: document.getElementById('riskScore'),
  riskRadarText: document.getElementById('riskRadarText'),
  heatLoss: document.getElementById('heatLoss'),
  heatTrades: document.getElementById('heatTrades'),
  heatSize: document.getElementById('heatSize'),
  heatSetup: document.getElementById('heatSetup'),
  heatRevenge: document.getElementById('heatRevenge'),
  heatCooldown: document.getElementById('heatCooldown'),
  nextActionCard: document.getElementById('nextActionCard'),
  nextActionTitle: document.getElementById('nextActionTitle'),
  nextActionText: document.getElementById('nextActionText'),
  reflectionGate: document.getElementById('reflectionGate'),
  reflectionStatus: document.getElementById('reflectionStatus'),
  coachCheckInThread: document.getElementById('coachCheckInThread'),
  coachCheckInInput: document.getElementById('coachCheckInInput'),
  sendCheckInReply: document.getElementById('sendCheckInReply'),
  reflectionHistory: document.getElementById('reflectionHistory'),
  rulesList: document.getElementById('rulesList'),
  behaviorList: document.getElementById('behaviorList'),
  sessionTimeline: document.getElementById('sessionTimeline'),
  coachFeed: document.getElementById('coachFeed'),
  escalationLevel: document.getElementById('escalationLevel'),
  adapterStatus: document.getElementById('adapterStatus'),
  apiServerStatus: document.getElementById('apiServerStatus'),
  openAiApiStatus: document.getElementById('openAiApiStatus'),
  projectXApiStatus: document.getElementById('projectXApiStatus'),
  refreshApiStatus: document.getElementById('refreshApiStatus'),
  toggleVoiceCoach: document.getElementById('toggleVoiceCoach'),
  connectProjectX: document.getElementById('connectProjectX'),
  syncProjectXReadOnly: document.getElementById('syncProjectXReadOnly'),
  apiConnectionMessage: document.getElementById('apiConnectionMessage'),
  eventLog: document.getElementById('eventLog'),
  logFilters: document.querySelectorAll('.log-filters button'),
  startSession: document.getElementById('startSession'),
  syncProjectXMock: document.getElementById('syncProjectXMock'),
  plannedWin: document.getElementById('plannedWin'),
  plannedLoss: document.getElementById('plannedLoss'),
  oversizeTrade: document.getElementById('oversizeTrade'),
  revengeTrade: document.getElementById('revengeTrade'),
  resetSession: document.getElementById('resetSession')
};

const voiceCoach = {
  peerConnection: null,
  dataChannel: null,
  mediaStream: null,
  audioElement: null
};

const SimulatorAdapter = {
  name: 'SimulatorAdapter',
  toTradingEvent(kind, context) {
    const plannedSetup = context.plan.approvedSetups[0] || 'Approved setup';
    const tradeMap = {
      plannedWin: { pnl: 420, size: 1, setup: plannedSetup },
      plannedLoss: { pnl: -300, size: 1, setup: plannedSetup },
      oversizeTrade: { pnl: -450, size: context.plan.maxContracts + 2, setup: plannedSetup },
      revengeTrade: { pnl: -650, size: Math.max(lastTradeSize() + 1, context.plan.maxContracts + 1), setup: 'Unplanned impulse entry', forceFast: true }
    };

    const simulatedTrade = tradeMap[kind];

    if (!simulatedTrade) {
      return null;
    }

    return normalizeTradingEvent({
      source: 'simulator',
      adapterName: this.name,
      action: kind,
      ...simulatedTrade
    }, context);
  }
};

const ProjectXAdapter = {
  name: 'ProjectXAdapter',
  status: 'First real API target - mock data only',
  isEnabled: false,
  connect() {
    return {
      ok: false,
      message: 'ProjectXAdapter is the first real API target, but real connectivity is intentionally disabled in this local MVP. It stores no credentials, makes no network calls, and cannot place trades.'
    };
  },
  mockSync(context) {
    return this.toNormalizedEvents(createMockProjectXPayload(context), context);
  },
  toNormalizedEvents(payload, context) {
    const orderSetups = setupByOrderId(payload.orders);
    const events = [
      {
        type: 'account_snapshot',
        source: 'projectx_mock',
        adapterName: this.name,
        timestamp: new Date(),
        account: payload.account
      },
      ...payload.positions.map((position) => ({
        type: 'position_snapshot',
        source: 'projectx_mock',
        adapterName: this.name,
        timestamp: new Date(position.creationTimestamp),
        position
      })),
      ...payload.orders.map((order) => ({
        type: 'order_snapshot',
        source: 'projectx_mock',
        adapterName: this.name,
        timestamp: new Date(order.updateTimestamp),
        order
      })),
      ...payload.trades
        .filter((trade) => trade.profitAndLoss !== null && !trade.voided)
        .map((trade) => normalizeTradingEvent({
          source: 'projectx_mock',
          adapterName: this.name,
          action: 'projectx_trade_fill',
          pnl: trade.profitAndLoss - trade.fees,
          size: trade.size,
          setup: orderSetups.get(trade.orderId) || 'Unknown ProjectX setup',
          timestamp: trade.creationTimestamp
        }, context))
    ];

    return events.sort((first, second) => first.timestamp - second.timestamp);
  }
};

const TopstepXAdapter = {
  name: 'TopstepXAdapter',
  status: 'Alias target for ProjectX API - disabled placeholder',
  isEnabled: false,
  connect() {
    return ProjectXAdapter.connect();
  },
  toTradingEvent() {
    return null;
  }
};

const TradovateAdapter = {
  name: 'TradovateAdapter',
  status: 'Paused - future adapter roadmap',
  isEnabled: false,
  connect() {
    return {
      ok: false,
      message: 'TradovateAdapter is paused for the initial MVP. It remains a future adapter option and is not used by the current behavior engine.'
    };
  },
  toTradingEvent() {
    return null;
  }
};

function createMockProjectXPayload(context) {
  const approvedSetup = context.plan.approvedSetups[0] || 'Opening range breakout';
  const secondApprovedSetup = context.plan.approvedSetups[1] || approvedSetup;
  const baseTime = new Date();
  baseTime.setMinutes(baseTime.getMinutes() - 20);

  const timestampMinutesFromBase = (minutes) => {
    const timestamp = new Date(baseTime);
    timestamp.setMinutes(baseTime.getMinutes() + minutes);
    return timestamp.toISOString();
  };

  const timestampSecondsFromBase = (seconds) => {
    const timestamp = new Date(baseTime);
    timestamp.setSeconds(baseTime.getSeconds() + seconds);
    return timestamp.toISOString();
  };

  const maxSizePlusOne = context.plan.maxContracts + 1;

  return {
    account: {
      id: 10001,
      name: 'Mock TopstepX Practice Account',
      balance: context.plan.accountCapital,
      canTrade: true,
      isVisible: true
    },
    positions: [
      {
        id: 501,
        accountId: 10001,
        contractId: 'CON.F.US.MNQ.M26',
        creationTimestamp: timestampMinutesFromBase(18),
        type: 'long',
        size: 0,
        averagePrice: 0
      }
    ],
    orders: [
      {
        id: 7001,
        accountId: 10001,
        contractId: 'CON.F.US.MNQ.M26',
        creationTimestamp: timestampMinutesFromBase(1),
        updateTimestamp: timestampMinutesFromBase(3),
        status: 'filled',
        type: 'market',
        side: 'buy',
        size: 1,
        fillVolume: 1,
        filledPrice: 19425.25,
        customTag: approvedSetup
      },
      {
        id: 7002,
        accountId: 10001,
        contractId: 'CON.F.US.MNQ.M26',
        creationTimestamp: timestampMinutesFromBase(9),
        updateTimestamp: timestampMinutesFromBase(11),
        status: 'filled',
        type: 'market',
        side: 'sell',
        size: 1,
        fillVolume: 1,
        filledPrice: 19410,
        customTag: secondApprovedSetup
      },
      {
        id: 7003,
        accountId: 10001,
        contractId: 'CON.F.US.MNQ.M26',
        creationTimestamp: timestampSecondsFromBase(705),
        updateTimestamp: timestampSecondsFromBase(735),
        status: 'filled',
        type: 'market',
        side: 'buy',
        size: maxSizePlusOne,
        fillVolume: maxSizePlusOne,
        filledPrice: 19418.75,
        customTag: 'Unplanned impulse entry'
      }
    ],
    trades: [
      {
        id: 9001,
        accountId: 10001,
        contractId: 'CON.F.US.MNQ.M26',
        creationTimestamp: timestampMinutesFromBase(3),
        price: 19425.25,
        profitAndLoss: 520,
        fees: 4,
        side: 'buy',
        size: 1,
        voided: false,
        orderId: 7001
      },
      {
        id: 9002,
        accountId: 10001,
        contractId: 'CON.F.US.MNQ.M26',
        creationTimestamp: timestampMinutesFromBase(11),
        price: 19410,
        profitAndLoss: -260,
        fees: 4,
        side: 'sell',
        size: 1,
        voided: false,
        orderId: 7002
      },
      {
        id: 9003,
        accountId: 10001,
        contractId: 'CON.F.US.MNQ.M26',
        creationTimestamp: timestampSecondsFromBase(735),
        price: 19418.75,
        profitAndLoss: -390,
        fees: 8,
        side: 'buy',
        size: maxSizePlusOne,
        voided: false,
        orderId: 7003
      },
      {
        id: 9004,
        accountId: 10001,
        contractId: 'CON.F.US.MNQ.M26',
        creationTimestamp: timestampMinutesFromBase(18),
        price: 19422,
        profitAndLoss: null,
        fees: 0,
        side: 'buy',
        size: 1,
        voided: false,
        orderId: 7004
      }
    ]
  };
}

function setupByOrderId(orders) {
  return orders.reduce((setups, order) => {
    setups.set(order.id, order.customTag || 'Unknown ProjectX setup');
    return setups;
  }, new Map());
}

const RulesEngine = {
  evaluate(event, context) {
    return evaluateRules(event, context);
  }
};

const InterventionEngine = {
  apply(riskEvents, context) {
    applyInterventions(riskEvents, context);
  }
};

function defaultSession() {
  return {
    dailyPnl: 0,
    positionSize: 0,
    tradeCount: 0,
    lossStreak: 0,
    escalationLevel: 0,
    riskLevel: 'Low',
    riskSummary: 'You are within your plan.',
    events: [],
    eventLog: [],
    reflectionRequired: false,
    coachCheckIn: defaultCoachCheckIn(),
    reflectionHistory: [],
    violationCounts: {},
    projectXMockSynced: false
  };
}

function defaultCoachCheckIn() {
  return {
    isOpen: false,
    stepIndex: 0,
    reason: '',
    messages: []
  };
}

function money(value) {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString()}`;
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function resolveApiBaseUrl() {
  const params = new URLSearchParams(window.location.search);
  const queryApiBase = params.get('apiBase');

  if (queryApiBase === 'local') {
    localStorage.removeItem('tradingCoachApiBaseUrl');
    return '';
  }

  if (queryApiBase) {
    const normalizedQueryUrl = normalizeApiBaseUrl(queryApiBase);
    localStorage.setItem('tradingCoachApiBaseUrl', normalizedQueryUrl);
    return normalizedQueryUrl;
  }

  const configuredUrl = window.TRADING_COACH_CONFIG?.apiBaseUrl || '';
  const storedUrl = localStorage.getItem('tradingCoachApiBaseUrl') || '';

  return normalizeApiBaseUrl(configuredUrl || storedUrl);
}

function normalizeApiBaseUrl(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function apiUrl(pathname) {
  if (/^https?:\/\//i.test(pathname)) {
    return pathname;
  }

  return `${API_BASE_URL}${pathname}`;
}

function isWeeklyCheckInOpen(date = new Date()) {
  return date.getDay() === 0;
}

function nextSundayLabel(date = new Date()) {
  const nextSunday = new Date(date);
  const daysUntilSunday = (7 - date.getDay()) % 7 || 7;
  nextSunday.setDate(date.getDate() + daysUntilSunday);
  return nextSunday.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function calculateRiskPlan(values) {
  const tier = RISK_TIERS[values.riskTier] || RISK_TIERS.moderate;
  const accountCapital = Math.max(0, Number(values.accountCapital) || 0);
  const estimatedRiskPerContract = Math.max(0, Number(values.estimatedRiskPerContract) || 0);
  const maxContracts = Math.max(1, Number(values.maxContracts) || 1);
  const maxTrades = Math.max(1, Number(values.maxTrades) || 1);
  const maxDailyLoss = Math.round(accountCapital * (tier.dailyPercent / 100));
  const plannedRiskPerTrade = estimatedRiskPerContract * maxContracts;
  const plannedFullDayRisk = plannedRiskPerTrade * maxTrades;

  return {
    tier,
    accountCapital,
    estimatedRiskPerContract,
    maxContracts,
    maxTrades,
    maxDailyLoss,
    plannedRiskPerTrade,
    plannedFullDayRisk,
    oneTradeFits: plannedRiskPerTrade <= maxDailyLoss,
    fullDayFits: plannedFullDayRisk <= maxDailyLoss
  };
}

function currentRiskFormValues() {
  return {
    accountCapital: Number(elements.accountCapital.value),
    riskTier: elements.riskTier.value,
    estimatedRiskPerContract: Number(elements.estimatedRiskPerContract.value),
    maxContracts: Number(elements.maxContracts.value),
    maxTrades: Number(elements.maxTrades.value)
  };
}

function buildPlanFromForm(riskPlan) {
  return {
    accountCapital: riskPlan.accountCapital,
    riskTier: elements.riskTier.value,
    dailyRiskPercent: riskPlan.tier.dailyPercent,
    marketBias: elements.marketBias.value,
    keyZones: elements.keyZones.value,
    approvedSetups: elements.approvedSetups.value.split(',').map((item) => item.trim()).filter(Boolean),
    estimatedRiskPerContract: riskPlan.estimatedRiskPerContract,
    maxDailyLoss: riskPlan.maxDailyLoss,
    maxContracts: riskPlan.maxContracts,
    maxTrades: riskPlan.maxTrades,
    cooldownAfterLosses: Number(elements.cooldownAfterLosses.value),
    behaviorToAvoid: elements.behaviorToAvoid.value.trim()
  };
}

function riskLimitsFromPlan(plan) {
  return {
    riskTier: plan.riskTier,
    dailyRiskPercent: plan.dailyRiskPercent,
    maxDailyLoss: plan.maxDailyLoss,
    estimatedRiskPerContract: plan.estimatedRiskPerContract,
    maxContracts: plan.maxContracts,
    maxTrades: plan.maxTrades
  };
}

function loosenedRiskFields(nextLimits, lockedLimits) {
  const loosened = [];

  if (nextLimits.dailyRiskPercent > lockedLimits.dailyRiskPercent) loosened.push('risk tier');
  if (nextLimits.maxDailyLoss > lockedLimits.maxDailyLoss) loosened.push('daily loss budget');
  if (nextLimits.estimatedRiskPerContract > lockedLimits.estimatedRiskPerContract) loosened.push('risk per contract');
  if (nextLimits.maxContracts > lockedLimits.maxContracts) loosened.push('max contracts');
  if (nextLimits.maxTrades > lockedLimits.maxTrades) loosened.push('max trades');

  return loosened;
}

function canSaveRiskPlan(riskPlan) {
  if (!riskPlan.oneTradeFits || !riskPlan.fullDayFits) {
    const reason = !riskPlan.oneTradeFits
      ? `One planned trade risks ${money(riskPlan.plannedRiskPerTrade)}, above the daily budget of ${money(riskPlan.maxDailyLoss)}.`
      : `The full planned day risks ${money(riskPlan.plannedFullDayRisk)}, above the daily budget of ${money(riskPlan.maxDailyLoss)}.`;

    return {
      ok: false,
      title: 'Plan risk too high',
      message: `${reason} Lower contract size, risk per contract, trade count, or choose a different risk tier during planning.`,
      log: 'Plan save blocked because planned risk exceeded the selected daily risk budget.'
    };
  }

  if (state.disciplineLock.isLocked) {
    const nextLimits = riskLimitsFromPlan(buildPlanFromForm(riskPlan));
    const loosened = loosenedRiskFields(nextLimits, state.disciplineLock.lockedLimits);

    if (loosened.length > 0) {
      return {
        ok: false,
        title: 'Discipline Lock blocked change',
        message: `Weekly plan is locked. You can lower risk, but you cannot increase ${loosened.join(', ')} until weekly check-in unlocks the plan.`,
        log: `Discipline Lock blocked increased risk: ${loosened.join(', ')}.`
      };
    }
  }

  return { ok: true };
}

function savePlan(event) {
  event.preventDefault();
  const riskPlan = calculateRiskPlan(currentRiskFormValues());
  const validation = canSaveRiskPlan(riskPlan);

  if (!validation.ok) {
    addCoachMessage(validation.title, validation.message, 'warning');
    recordEventLog('Risk Plan', validation.log);
    render();
    return;
  }

  state.plan = buildPlanFromForm(riskPlan);

  if (state.disciplineLock.isLocked) {
    state.disciplineLock.lockedLimits = riskLimitsFromPlan(state.plan);
  }

  addCoachMessage('Plan saved', `${riskPlan.tier.name} sets a daily loss limit of ${money(riskPlan.maxDailyLoss)}. Your contract and trade limits fit inside that budget.`, 'info');
  recordEventLog('Risk Plan', `${riskPlan.tier.name} saved with ${money(riskPlan.maxDailyLoss)} daily risk budget.`);
  render();
}

function lockWeeklyPlan() {
  const riskPlan = calculateRiskPlan(currentRiskFormValues());
  const validation = canSaveRiskPlan(riskPlan);

  if (!validation.ok) {
    addCoachMessage(validation.title, validation.message, 'warning');
    recordEventLog('Discipline Lock', 'Lock attempt blocked because the current plan is not valid.');
    render();
    return;
  }

  state.plan = buildPlanFromForm(riskPlan);
  state.disciplineLock.isLocked = true;
  state.disciplineLock.lockedLimits = riskLimitsFromPlan(state.plan);

  addCoachMessage('Weekly plan locked', 'Discipline Lock is active. You can lower risk, but you cannot loosen risk controls until weekly check-in unlocks the plan.', 'info');
  recordEventLog('Discipline Lock', 'Weekly plan locked.');
  render();
}

function unlockWeeklyPlan() {
  if (!isWeeklyCheckInOpen()) {
    const nextOpen = nextSundayLabel();
    addCoachMessage('Weekly check-in closed', `Discipline Lock can only be unlocked on Sunday. Next weekly check-in opens ${nextOpen}.`, 'warning');
    recordEventLog('Discipline Lock', `Unlock blocked. Weekly check-in opens ${nextOpen}.`);
    render();
    return;
  }

  state.disciplineLock.isLocked = false;
  state.disciplineLock.lockedLimits = null;

  addCoachMessage('Sunday check-in unlock', 'The weekly plan is unlocked for review. This prototype unlock simulates a future Sunday weekly check-in.', 'info');
  recordEventLog('Discipline Lock', 'Weekly check-in unlocked the plan.');
  render();
}

function startSession() {
  state.isLive = true;
  recordEventLog('Session', 'Started live simulator monitoring.');
  addCoachMessage('Session started', `Good morning. Your bias is ${state.plan.marketBias}. I will watch trade count, sizing, loss streaks, cooldown behavior, and plan deviations.`, 'info');
  render();
}

function resetSession() {
  state.isLive = false;
  state.activeAdapterName = 'SimulatorAdapter';
  state.session = defaultSession();
  state.weeklyReview = null;
  state.endDayReview = null;
  state.disciplineLock.isLocked = false;
  state.disciplineLock.lockedLimits = null;
  elements.coachFeed.innerHTML = '';
  recordEventLog('Session', 'Reset simulator state and cleared prior events.');
  addCoachMessage('Session reset', 'The simulator is clear. Discipline Lock was also cleared for prototype testing. Save the plan and start a new session when ready.', 'info');
  render();
}

function runEndDayReview() {
  const review = createEndDayReview();
  state.endDayReview = review;

  addCoachMessage('End-of-day review complete', review.summary, review.level);
  recordEventLog('End-of-Day Review', review.recommendation);
  render();
}

function createEndDayReview() {
  const session = state.session;
  const plan = state.plan;
  const violationCount = totalRuleViolations();
  const severeViolationCount = totalSevereViolations();
  const offPlanTrades = session.events.filter((event) => !event.isApprovedSetup).length;
  const dailyLoss = Math.abs(Math.min(session.dailyPnl, 0));
  const dailyBudgetUsed = plan.maxDailyLoss > 0 ? Math.round((dailyLoss / plan.maxDailyLoss) * 100) : 0;
  const profitGiveback = calculateProfitGiveback(session.events);
  let recommendation = 'No Trades Recorded';
  let level = 'info';
  let summary = 'No trades are recorded yet. There is nothing to review for the day.';

  if (session.tradeCount > 0 && session.escalationLevel >= 5) {
    recommendation = 'Stop And Review';
    level = 'danger';
    summary = 'The day reached lockout recommendation. The next session should start only after reviewing the rule break and tightening risk.';
  } else if (session.tradeCount > 0 && session.dailyPnl < 0 && dailyBudgetUsed >= 75) {
    recommendation = 'Reduce Pressure Tomorrow';
    level = 'warning';
    summary = `The session ended down ${money(session.dailyPnl)} and used ${dailyBudgetUsed}% of the daily loss budget. Tomorrow should start with reduced pressure.`;
  } else if (session.tradeCount > 0 && session.dailyPnl > 0 && profitGiveback.percent >= 35) {
    recommendation = 'Protect Gains Tomorrow';
    level = 'warning';
    summary = `The session ended green, but gave back ${profitGiveback.percent}% of peak profit. The next session should protect gains earlier.`;
  } else if (session.tradeCount > 0 && (violationCount > 0 || session.escalationLevel >= 3)) {
    recommendation = 'Guarded Tomorrow';
    level = 'warning';
    summary = `The session ended ${session.dailyPnl >= 0 ? 'positive' : 'inside risk'}, but rule pressure showed up. Tomorrow should continue with guardrails.`;
  } else if (session.tradeCount > 0 && session.dailyPnl >= 0) {
    recommendation = 'Normal Tomorrow';
    summary = 'The session stayed controlled and non-negative. Tomorrow can start with the normal plan.';
  } else if (session.tradeCount > 0) {
    recommendation = 'Normal But Patient Tomorrow';
    summary = 'The session ended red but inside risk, without major behavior problems. Tomorrow should focus on patience and plan quality.';
  }

  return {
    recommendation,
    level,
    summary,
    rows: [
      ['Net performance', money(session.dailyPnl), session.dailyPnl >= 0],
      ['Trades taken', `${session.tradeCount} / ${plan.maxTrades}`, session.tradeCount <= plan.maxTrades],
      ['Daily loss used', `${money(-dailyLoss)} / ${money(-plan.maxDailyLoss)} (${dailyBudgetUsed}%)`, dailyLoss < plan.maxDailyLoss],
      ['Profit giveback', `${money(profitGiveback.amount)} / ${money(profitGiveback.peak)} (${profitGiveback.percent}%)`, profitGiveback.percent < 35],
      ['Rule violations', violationCount, violationCount === 0],
      ['Severe violations', severeViolationCount, severeViolationCount === 0],
      ['Off-plan trades', offPlanTrades, offPlanTrades === 0],
      ['Highest intervention', `Level ${session.escalationLevel}`, session.escalationLevel < 3],
      ['Coach check-ins', session.reflectionHistory.length, session.reflectionHistory.length > 0 || session.escalationLevel < 3]
    ]
  };
}

function runWeeklyReview() {
  const review = createWeeklyReview();
  state.weeklyReview = review;

  addCoachMessage('Weekly review complete', review.message, review.level);
  recordEventLog('Weekly Review', `${review.recommendation}. Suggested tier: ${review.suggestedTierName}.`);
  render();
}

function createWeeklyReview() {
  const session = state.session;
  const plan = state.plan;
  const violationCount = totalRuleViolations();
  const severeViolationCount = totalSevereViolations();
  const offPlanTrades = session.events.filter((event) => !event.isApprovedSetup).length;
  const dailyLoss = Math.abs(Math.min(session.dailyPnl, 0));
  const dailyBudgetUsed = plan.maxDailyLoss > 0 ? Math.round((dailyLoss / plan.maxDailyLoss) * 100) : 0;
  const profitGiveback = calculateProfitGiveback(session.events);
  const isProfitable = session.dailyPnl > 0;
  const isLosing = session.dailyPnl < 0;
  const cleanExecution = violationCount === 0 && session.escalationLevel <= 1;
  const performanceIsFading = isProfitable && profitGiveback.percent >= 35;
  const seriousRiskProblem = session.escalationLevel >= 5 || severeViolationCount >= 2 || dailyBudgetUsed >= 100;
  const needsTightening = violationCount > 0 || session.escalationLevel >= 3 || dailyBudgetUsed >= 75;
  const currentTierName = RISK_TIERS[plan.riskTier].name;
  let recommendation = 'Stay At Current Tier';
  let suggestedRiskTier = plan.riskTier;
  let level = 'info';
  let message = `${currentTierName} still fits the current review. Keep the plan steady and collect more evidence.`;

  if (session.tradeCount === 0) {
    message = 'No trades are recorded yet, so the review is informational only. Keep the current tier until there is real session behavior to grade.';
  } else if (isProfitable && cleanExecution && !performanceIsFading) {
    recommendation = 'Eligible To Move Up';
    suggestedRiskTier = adjacentRiskTier(plan.riskTier, 1);
    message = suggestedRiskTier === plan.riskTier
      ? `${currentTierName} is already the highest prototype tier. Stay there only if execution remains controlled.`
      : `Profitable, clean execution makes the trader eligible to discuss moving from ${currentTierName} to ${RISK_TIERS[suggestedRiskTier].name}.`;
  } else if (isProfitable && performanceIsFading) {
    recommendation = 'Protect Gains';
    level = 'warning';
    message = `The trader is still profitable, so this is not a move-down review. Performance is fading after giving back ${profitGiveback.percent}% of peak session profit, so protect gains and tighten execution before pressing harder.`;
  } else if (isProfitable && needsTightening) {
    recommendation = 'Continue With Guardrails';
    level = 'warning';
    message = `The trader finished profitable, so the review should allow continued trading at ${currentTierName}. Keep the same tier, tighten the rule breaks, and require cleaner execution before moving up.`;
  } else if (isLosing && seriousRiskProblem) {
    recommendation = 'Move Down';
    suggestedRiskTier = adjacentRiskTier(plan.riskTier, -1);
    level = 'danger';
    message = `The trader lost money and used too much of the risk budget. Move down from ${currentTierName} to ${RISK_TIERS[suggestedRiskTier].name} before increasing risk again.`;
  } else if (isLosing && needsTightening) {
    recommendation = 'Stay And Tighten';
    level = 'warning';
    message = `The trader lost money, but did not hit the hardest move-down threshold. Stay at ${currentTierName}, reduce pressure, and tighten execution before considering more risk.`;
  } else if (isLosing) {
    message = `The trader is down on the review period, but the loss stayed inside the risk budget. Stay at ${currentTierName} and focus on controlled execution.`;
  }

  return {
    recommendation,
    suggestedRiskTier,
    suggestedTierName: RISK_TIERS[suggestedRiskTier].name,
    level,
    message,
    rows: [
      ['Current tier', `${currentTierName} (${plan.dailyRiskPercent}%)`, true],
      ['Suggested tier', `${RISK_TIERS[suggestedRiskTier].name} (${RISK_TIERS[suggestedRiskTier].dailyPercent}%)`, recommendation !== 'Move Down'],
      ['Net performance', money(session.dailyPnl), session.dailyPnl >= 0],
      ['Profit giveback', `${money(profitGiveback.amount)} / ${money(profitGiveback.peak)} (${profitGiveback.percent}%)`, profitGiveback.percent < 35],
      ['Daily loss used', `${money(-dailyLoss)} / ${money(-plan.maxDailyLoss)} (${dailyBudgetUsed}%)`, dailyLoss < plan.maxDailyLoss],
      ['Rule violations', violationCount, violationCount === 0],
      ['Severe violations', severeViolationCount, severeViolationCount === 0],
      ['Off-plan trades', offPlanTrades, offPlanTrades === 0],
      ['Highest intervention', `Level ${session.escalationLevel}`, session.escalationLevel < 3],
      ['Check-ins recorded', session.reflectionHistory.length, session.reflectionHistory.length > 0 || session.escalationLevel < 3]
    ]
  };
}

function calculateProfitGiveback(events) {
  let runningPnl = 0;
  let peakPnl = 0;

  events.forEach((event) => {
    runningPnl += event.realizedPnl;
    peakPnl = Math.max(peakPnl, runningPnl);
  });

  const givebackAmount = Math.max(0, peakPnl - runningPnl);
  const givebackPercent = peakPnl > 0 ? Math.round((givebackAmount / peakPnl) * 100) : 0;

  return {
    amount: givebackAmount,
    peak: peakPnl,
    percent: givebackPercent
  };
}

function totalRuleViolations() {
  return Object.values(state.session.violationCounts).reduce((total, count) => total + count, 0);
}

function totalSevereViolations() {
  const severeTypes = [
    'Position size breach',
    'Max trades breach',
    'Daily loss limit breach',
    'Cooldown trigger',
    'Fast re-entry after loss',
    'Possible revenge trading',
    'Plan deviation'
  ];

  return severeTypes.reduce((total, type) => total + (state.session.violationCounts[type] || 0), 0);
}

function adjacentRiskTier(currentRiskTier, direction) {
  const currentIndex = RISK_TIER_ORDER.indexOf(currentRiskTier);
  const safeIndex = currentIndex === -1 ? RISK_TIER_ORDER.indexOf('moderate') : currentIndex;
  const nextIndex = Math.min(Math.max(safeIndex + direction, 0), RISK_TIER_ORDER.length - 1);
  return RISK_TIER_ORDER[nextIndex];
}

function simulateTrade(kind) {
  if (!state.isLive) {
    recordEventLog('Simulator', 'Ignored action because the session is not live.');
    addCoachMessage('Session not started', 'Start the session first so I can monitor behavior in real time.', 'warning');
    return;
  }

  if (isTradeBlocked()) {
    const reason = state.session.escalationLevel >= 5
      ? 'Lockout recommended. Reset the session before simulating more trades.'
      : 'Coach check-in required before the next simulator trade.';
    recordEventLog('Coach Check-In', reason);
    addCoachMessage('Trade paused', reason, 'warning');
    render();
    return;
  }

  recordEventLog('Simulator', `Button action received: ${labelForSimulatorAction(kind)}.`);
  const event = SimulatorAdapter.toTradingEvent(kind, state);

  if (!event) {
    recordEventLog('Adapter', `Could not normalize simulator action: ${kind}.`);
    addCoachMessage('Simulator event ignored', 'That simulator action could not be converted into a trading event.', 'warning');
    return;
  }

  recordEventLog('Adapter', `Normalized ${event.action} into ${event.type} from ${event.adapterName}.`);
  processTradingEvent(event);
}

function syncProjectXMockData() {
  if (!state.isLive) {
    recordEventLog('ProjectX Mock', 'Ignored sync because the session is not live.');
    addCoachMessage('Session not started', 'Start the session first so ProjectX-style data can feed the live monitor.', 'warning');
    render();
    return;
  }

  if (state.session.projectXMockSynced) {
    recordEventLog('ProjectX Mock', 'Ignored duplicate mock sync for this session.');
    addCoachMessage('Mock data already synced', 'Reset the session before replaying the ProjectX mock data again.', 'warning');
    render();
    return;
  }

  const normalizedEvents = ProjectXAdapter.mockSync(state);
  const snapshotCount = normalizedEvents.filter((event) => event.type !== 'position_closed').length;
  const closedTrades = normalizedEvents.filter((event) => event.type === 'position_closed');

  state.activeAdapterName = ProjectXAdapter.name;
  state.session.projectXMockSynced = true;

  recordEventLog('ProjectX Mock', `Received ${snapshotCount} snapshots and ${closedTrades.length} closed trades from safe mock data.`);

  normalizedEvents
    .filter((event) => event.type !== 'position_closed')
    .forEach((event) => {
      recordEventLog('Adapter', `Logged ${event.type} from ${event.adapterName}.`);
    });

  closedTrades.forEach((event) => {
    recordEventLog('Adapter', `Normalized ${event.action} into ${event.type} from ${event.adapterName}.`);
    processTradingEvent(event);
  });

  addCoachMessage('ProjectX mock sync complete', `${closedTrades.length} completed trade results were processed through the broker-neutral monitoring engine. No network call or broker action occurred.`, 'info');
  render();
}

async function refreshApiStatus() {
  try {
    const status = await fetchJson('/api/status');

    state.api.serverOnline = true;
    state.api.openAiConfigured = Boolean(status.openai?.configured);
    state.api.projectXConfigured = Boolean(status.projectx?.configured);
    state.api.projectXConnected = Boolean(status.projectx?.connected);
    state.auth.configured = Boolean(status.auth?.configured);
    state.auth.required = Boolean(status.auth?.required);
    state.auth.user = status.auth?.user || state.auth.user;

    setApiMessage(`${state.api.baseUrl || 'Same-origin'} backend is available. Configure server environment variables to enable real connections.`, 'info');
  } catch (error) {
    state.api.serverOnline = false;
    state.api.openAiConfigured = false;
    state.api.projectXConfigured = false;
    state.api.projectXConnected = false;
    setApiMessage('Backend API is not reachable. Static simulator mode still works.', 'warning');
  }

  renderApiConnections();
}

async function toggleVoiceCoach() {
  if (state.api.voiceConnected) {
    stopVoiceCoach();
    return;
  }

  await startVoiceCoach();
}

async function startVoiceCoach() {
  if (!state.api.serverOnline) {
    await refreshApiStatus();
  }

  if (!state.api.serverOnline || !state.api.openAiConfigured) {
    setApiMessage('OpenAI voice is not configured. Add OPENAI_API_KEY to .env and restart the local server.', 'warning');
    return;
  }

  if (!window.RTCPeerConnection || !navigator.mediaDevices?.getUserMedia) {
    setApiMessage('This browser does not support the WebRTC microphone flow needed for Realtime voice.', 'warning');
    return;
  }

  try {
    setApiMessage('Starting OpenAI Realtime voice session...', 'info');
    const session = await fetchJson('/api/openai/realtime/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: voiceCoachContext() })
    });
    const ephemeralKey = extractRealtimeSecret(session);

    if (!ephemeralKey) {
      throw new Error('The local server did not return an OpenAI Realtime client secret.');
    }

    const peerConnection = new RTCPeerConnection();
    const audioElement = document.createElement('audio');
    audioElement.autoplay = true;
    peerConnection.ontrack = (event) => {
      audioElement.srcObject = event.streams[0];
    };

    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream.getTracks().forEach((track) => peerConnection.addTrack(track, mediaStream));

    const dataChannel = peerConnection.createDataChannel('oai-events');
    dataChannel.addEventListener('open', () => {
      sendVoiceCoachContext();
      setApiMessage('Voice coach connected. Speak normally; stop it when the session is done.', 'success');
    });
    dataChannel.addEventListener('message', (event) => {
      handleRealtimeEvent(event.data);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        'Content-Type': 'application/sdp'
      },
      body: offer.sdp
    });

    if (!sdpResponse.ok) {
      throw new Error(`Realtime WebRTC connection failed with status ${sdpResponse.status}.`);
    }

    await peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: await sdpResponse.text()
    });

    voiceCoach.peerConnection = peerConnection;
    voiceCoach.dataChannel = dataChannel;
    voiceCoach.mediaStream = mediaStream;
    voiceCoach.audioElement = audioElement;
    state.api.voiceConnected = true;
    recordEventLog('OpenAI Voice', 'Realtime voice coach session started.');
    addCoachMessage('Voice coach started', 'Realtime voice is connected. The rules engine still controls risk state; voice is for coaching and check-ins.', 'info');
  } catch (error) {
    stopVoiceCoach(false);
    setApiMessage(error.message, 'warning');
    recordEventLog('OpenAI Voice', `Voice connection failed: ${error.message}`);
  }

  render();
}

function stopVoiceCoach(announce = true) {
  if (voiceCoach.dataChannel) {
    voiceCoach.dataChannel.close();
  }

  if (voiceCoach.peerConnection) {
    voiceCoach.peerConnection.close();
  }

  if (voiceCoach.mediaStream) {
    voiceCoach.mediaStream.getTracks().forEach((track) => track.stop());
  }

  voiceCoach.peerConnection = null;
  voiceCoach.dataChannel = null;
  voiceCoach.mediaStream = null;
  voiceCoach.audioElement = null;
  state.api.voiceConnected = false;

  if (announce) {
    setApiMessage('Voice coach stopped.', 'info');
    recordEventLog('OpenAI Voice', 'Realtime voice coach session stopped.');
  }

  render();
}

function extractRealtimeSecret(session) {
  return session.clientSecret?.value
    || session.clientSecret?.client_secret?.value
    || session.clientSecret?.secret?.value
    || session.value
    || null;
}

function voiceCoachContext() {
  return {
    plan: {
      marketBias: state.plan.marketBias,
      approvedSetups: state.plan.approvedSetups,
      maxDailyLoss: state.plan.maxDailyLoss,
      maxContracts: state.plan.maxContracts,
      maxTrades: state.plan.maxTrades,
      cooldownAfterLosses: state.plan.cooldownAfterLosses,
      behaviorToAvoid: state.plan.behaviorToAvoid
    },
    session: {
      isLive: state.isLive,
      dailyPnl: state.session.dailyPnl,
      positionSize: state.session.positionSize,
      tradeCount: state.session.tradeCount,
      lossStreak: state.session.lossStreak,
      riskLevel: state.session.riskLevel,
      riskSummary: state.session.riskSummary,
      escalationLevel: state.session.escalationLevel,
      reflectionRequired: state.session.reflectionRequired
    }
  };
}

function sendVoiceCoachContext() {
  if (!voiceCoach.dataChannel || voiceCoach.dataChannel.readyState !== 'open') {
    return;
  }

  voiceCoach.dataChannel.send(JSON.stringify({
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: `Session context for the trading coach: ${JSON.stringify(voiceCoachContext())}`
        }
      ]
    }
  }));
}

function handleRealtimeEvent(rawEvent) {
  try {
    const event = JSON.parse(rawEvent);

    if (event.type === 'response.done') {
      recordEventLog('OpenAI Voice', 'Realtime coach response completed.');
    }
  } catch {
    recordEventLog('OpenAI Voice', 'Received a non-JSON realtime event.');
  }
}

async function connectProjectXApi() {
  try {
    const result = await fetchJson('/api/projectx/connect', { method: 'POST' });
    state.api.projectXConfigured = true;
    state.api.projectXConnected = Boolean(result.connected);
    setApiMessage(result.connected ? 'ProjectX connected in read-only mode.' : 'ProjectX did not connect.', result.connected ? 'success' : 'warning');
    recordEventLog('ProjectX API', result.connected ? 'Connected through local server.' : 'Connection attempt did not complete.');
  } catch (error) {
    state.api.projectXConnected = false;
    setApiMessage(error.message, 'warning');
    recordEventLog('ProjectX API', `Connection failed: ${error.message}`);
  }

  render();
}

async function syncProjectXReadOnlyData() {
  if (!state.isLive) {
    recordEventLog('ProjectX API', 'Ignored read-only sync because the session is not live.');
    addCoachMessage('Session not started', 'Start the session before syncing real ProjectX read-only data.', 'warning');
    render();
    return;
  }

  try {
    if (!state.api.projectXConnected) {
      await connectProjectXApi();
    }

    const accountsResponse = await fetchJson('/api/projectx/accounts');
    const account = firstArrayItem(accountsResponse.data?.accounts) || {};
    const accountId = account.id;
    const query = accountId ? `?accountId=${encodeURIComponent(accountId)}` : '';
    const [positionsResponse, ordersResponse, tradesResponse] = await Promise.all([
      fetchJson(`/api/projectx/positions${query}`),
      fetchJson(`/api/projectx/orders${query}`),
      fetchJson(`/api/projectx/trades${query}`)
    ]);
    const payload = {
      account,
      positions: positionsResponse.data?.positions || [],
      orders: ordersResponse.data?.orders || [],
      trades: tradesResponse.data?.trades || []
    };
    const normalizedEvents = ProjectXAdapter.toNormalizedEvents(payload, state);
    const closedTrades = normalizedEvents.filter((event) => event.type === 'position_closed');

    state.activeAdapterName = ProjectXAdapter.name;
    recordEventLog('ProjectX API', `Synced ${closedTrades.length} closed trade event${closedTrades.length === 1 ? '' : 's'} from read-only data.`);

    closedTrades.forEach((event) => {
      recordEventLog('Adapter', `Normalized ${event.action} into ${event.type} from ${event.adapterName}.`);
      processTradingEvent(event);
    });

    addCoachMessage('ProjectX sync complete', `${closedTrades.length} completed trade results were processed from read-only ProjectX data. No trade actions were sent.`, 'info');
  } catch (error) {
    setApiMessage(error.message, 'warning');
    recordEventLog('ProjectX API', `Read-only sync failed: ${error.message}`);
  }

  render();
}

function firstArrayItem(value) {
  return Array.isArray(value) && value.length > 0 ? value[0] : null;
}

async function fetchJson(url, options = {}, authOptions = {}) {
  const requestOptions = { ...options };
  const headers = { ...(requestOptions.headers || {}) };

  if (!authOptions.skipAuth) {
    const token = await getAuthToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  requestOptions.headers = headers;
  const response = await fetch(apiUrl(url), requestOptions);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    throw new Error(data.message || `Request failed: ${url}`);
  }

  return data;
}

function setApiMessage(message, level) {
  elements.apiConnectionMessage.textContent = message;
  elements.apiConnectionMessage.className = `api-message ${level || 'info'}`;
}

async function initializeAuth() {
  elements.localPrototypeMode.addEventListener('click', enterLocalPrototypeMode);

  try {
    const config = await fetchJson('/api/auth/config', {}, { skipAuth: true });
    state.auth.configured = Boolean(config.configured);
    state.auth.required = Boolean(config.required);
    state.auth.user = config.user || null;

    if (!state.auth.configured) {
      elements.authGateMessage.textContent = 'Clerk is not configured yet. Add Clerk keys to .env to enable Google login and passkeys.';
      elements.localPrototypeMode.hidden = false;
      return;
    }

    elements.authGateMessage.textContent = 'Sign in to open the protected trading workspace.';
    elements.localPrototypeMode.hidden = true;
    const clerk = await loadClerk(config.publishableKey);
    state.auth.clerk = clerk;

    if (clerk.isSignedIn) {
      enterAuthenticatedApp(clerk);
      return;
    }

    mountClerkSignIn(clerk);

    if (typeof clerk.addListener === 'function') {
      clerk.addListener(({ user }) => {
        if (user) {
          enterAuthenticatedApp(clerk);
          return;
        }

        if (state.auth.signedIn && !state.auth.localPrototypeMode) {
          showSignedOutGate(clerk);
        }
      });
    }
  } catch (error) {
    elements.authGateMessage.textContent = 'Static demo mode is available. Backend auth, OpenAI voice, and ProjectX data require the local server or a deployed backend.';
    elements.localPrototypeMode.hidden = false;
  }
}

async function loadClerk(publishableKey) {
  if (!publishableKey) {
    throw new Error('Missing Clerk publishable key.');
  }

  const clerkDomain = atob(publishableKey.split('_')[2]).slice(0, -1);
  await loadScript(`https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`);
  await loadScript(`https://${clerkDomain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, {
    'data-clerk-publishable-key': publishableKey
  });

  if (!window.Clerk) {
    throw new Error('Clerk did not load.');
  }

  await window.Clerk.load({
    ui: { ClerkUI: window.__internal_ClerkUICtor }
  });

  return window.Clerk;
}

function loadScript(src, attributes = {}) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);

    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    Object.entries(attributes).forEach(([name, value]) => {
      script.setAttribute(name, value);
    });
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

function mountClerkSignIn(clerk) {
  elements.clerkAuthMount.innerHTML = '';
  clerk.mountSignIn(elements.clerkAuthMount);
}

function enterAuthenticatedApp(clerk) {
  state.auth.signedIn = true;
  state.auth.localPrototypeMode = false;
  state.auth.user = clerk.user
    ? {
        id: clerk.user.id,
        email: clerk.user.primaryEmailAddress?.emailAddress || null
      }
    : null;

  elements.authGate.classList.add('auth-hidden');
  elements.appShell.classList.remove('auth-hidden');
  elements.clerkAuthMount.innerHTML = '';
  elements.userProfileSlot.innerHTML = '';
  clerk.mountUserButton(elements.userProfileSlot);
  render();
  refreshApiStatus();
}

function showSignedOutGate(clerk) {
  state.auth.signedIn = false;
  state.auth.user = null;
  elements.appShell.classList.add('auth-hidden');
  elements.authGate.classList.remove('auth-hidden');
  elements.userProfileSlot.innerHTML = '';
  elements.authGateMessage.textContent = 'Sign in to open the protected trading workspace.';
  mountClerkSignIn(clerk);
}

function enterLocalPrototypeMode() {
  state.auth.signedIn = true;
  state.auth.localPrototypeMode = true;
  state.auth.user = null;
  elements.authGate.classList.add('auth-hidden');
  elements.appShell.classList.remove('auth-hidden');
  setApiMessage('Local prototype mode is active. Configure Clerk to require sign-in for real users.', 'warning');
  render();
  refreshApiStatus();
}

async function getAuthToken() {
  if (!state.auth.clerk || !state.auth.clerk.session) {
    return null;
  }

  return state.auth.clerk.session.getToken();
}

function labelForSimulatorAction(kind) {
  const labels = {
    plannedWin: 'planned win',
    plannedLoss: 'planned loss',
    oversizeTrade: 'oversize trade',
    revengeTrade: 'fast revenge trade'
  };

  return labels[kind] || kind;
}

function lastTradeSize() {
  const last = state.session.events[state.session.events.length - 1];
  return last ? last.positionSize : 0;
}

function normalizeTradingEvent(rawEvent, context) {
  const previousTrade = context.session.events[context.session.events.length - 1];
  let timestamp = rawEvent.timestamp ? new Date(rawEvent.timestamp) : new Date();

  if (Number.isNaN(timestamp.getTime())) {
    timestamp = new Date();
  }

  if (rawEvent.forceFast && previousTrade) {
    timestamp = new Date(previousTrade.timestamp.getTime() + 45000);
  }

  return {
    type: 'position_closed',
    source: rawEvent.source,
    adapterName: rawEvent.adapterName,
    action: rawEvent.action,
    timestamp,
    realizedPnl: rawEvent.pnl,
    positionSize: rawEvent.size,
    setup: rawEvent.setup,
    isApprovedSetup: context.plan.approvedSetups.includes(rawEvent.setup)
  };
}

function processTradingEvent(event) {
  applyTradeEventToSession(event, state);
  const riskEvents = RulesEngine.evaluate(event, state);
  const rulesSummary = riskEvents.length === 0
    ? 'Rules checked: no violations found.'
    : `Rules checked: ${riskEvents.length} violation${riskEvents.length === 1 ? '' : 's'} found.`;
  recordEventLog('Rules', rulesSummary);
  InterventionEngine.apply(riskEvents, state);
  render();
}

function applyTradeEventToSession(event, context) {
  const session = context.session;

  session.tradeCount += 1;
  session.dailyPnl += event.realizedPnl;
  session.positionSize = event.positionSize;
  session.lossStreak = event.realizedPnl < 0 ? session.lossStreak + 1 : 0;
  session.events.push(event);
}

function evaluateRules(event, context) {
  const riskEvents = [];
  const session = context.session;
  const plan = context.plan;
  const previousTrade = session.events[session.events.length - 2];
  const dailyLoss = Math.abs(Math.min(session.dailyPnl, 0));
  const nearLossLimit = dailyLoss >= plan.maxDailyLoss * 0.75 && dailyLoss < plan.maxDailyLoss;
  const breachedLossLimit = dailyLoss >= plan.maxDailyLoss;
  const tooFastAfterLoss = previousTrade && previousTrade.realizedPnl < 0 && minutesBetween(previousTrade.timestamp, event.timestamp) < 2;
  const increasedSizeAfterLoss = previousTrade && previousTrade.realizedPnl < 0 && event.positionSize > previousTrade.positionSize;

  if (event.positionSize > plan.maxContracts) {
    riskEvents.push({ type: 'Position size breach', severity: 3, interventionLevel: 3, message: `You used ${event.positionSize} contracts, above your max of ${plan.maxContracts}.` });
  }

  if (session.tradeCount > plan.maxTrades) {
    riskEvents.push({ type: 'Max trades breach', severity: 3, interventionLevel: 3, message: `You have taken ${session.tradeCount} trades, above your max of ${plan.maxTrades}.` });
  }

  if (nearLossLimit) {
    riskEvents.push({ type: 'Approaching daily loss limit', severity: 2, interventionLevel: 2, message: `You are within 25% of your max daily loss of ${money(-plan.maxDailyLoss)}.` });
  }

  if (breachedLossLimit) {
    riskEvents.push({ type: 'Daily loss limit breach', severity: 5, interventionLevel: 5, message: 'Your daily loss limit has been breached. Trading should stop for the session.' });
  }

  if (session.lossStreak >= plan.cooldownAfterLosses) {
    riskEvents.push({ type: 'Cooldown trigger', severity: 4, interventionLevel: 4, message: `You have ${session.lossStreak} losses in a row. Your plan calls for a cooldown.` });
  }

  if (tooFastAfterLoss) {
    riskEvents.push({ type: 'Fast re-entry after loss', severity: 3, interventionLevel: 3, message: 'You re-entered less than 2 minutes after a losing trade.' });
  }

  if (increasedSizeAfterLoss) {
    riskEvents.push({ type: 'Possible revenge trading', severity: 4, interventionLevel: 4, message: 'You increased size immediately after a loss. This matches a revenge-trading pattern.' });
  }

  if (!event.isApprovedSetup) {
    riskEvents.push({ type: 'Plan deviation', severity: 3, interventionLevel: 3, message: `This trade used "${event.setup}", which is not in your approved setups.` });
  }

  return riskEvents;
}

function minutesBetween(first, second) {
  return Math.abs(second.getTime() - first.getTime()) / 60000;
}

function isTradeBlocked() {
  return state.session.reflectionRequired || state.session.escalationLevel >= 5;
}

function applyInterventions(riskEvents, context) {
  const session = context.session;

  if (riskEvents.length === 0) {
    recordEventLog('Intervention', 'Stayed at normal monitoring.');
    addCoachMessage('Trade accepted', 'That trade stayed inside your current plan and risk limits. Keep executing patiently.', 'info');
    session.riskLevel = 'Low';
    session.riskSummary = 'You are within your plan.';
    return;
  }

  riskEvents.forEach((riskEvent) => {
    session.violationCounts[riskEvent.type] = (session.violationCounts[riskEvent.type] || 0) + 1;
  });

  const topEvent = riskEvents.sort((a, b) => b.severity - a.severity)[0];
  const repeatedSevereViolation = Object.values(session.violationCounts).some((count) => count >= 2) && topEvent.severity >= 3;
  const nextLevel = repeatedSevereViolation ? Math.min(5, topEvent.interventionLevel + 1) : topEvent.interventionLevel;

  session.escalationLevel = Math.max(session.escalationLevel, nextLevel);
  session.riskLevel = session.escalationLevel >= 5 ? 'Critical' : session.escalationLevel >= 4 ? 'High' : 'Elevated';
  session.riskSummary = topEvent.message;
  recordEventLog('Intervention', `Escalation is now Level ${session.escalationLevel}: ${INTERVENTION_LEVELS[session.escalationLevel].name}.`);

  if (session.escalationLevel >= 3) {
    session.reflectionRequired = true;
    openCoachCheckIn(topEvent);
    recordEventLog('Coach Check-In', 'A coach check-in is required before simulator trading can continue.');
  }

  riskEvents.forEach((riskEvent) => {
    addCoachMessage(riskEvent.type, coachTextFor(riskEvent), riskEvent.interventionLevel >= 4 ? 'danger' : 'warning');
  });

  if (repeatedSevereViolation) {
    addCoachMessage('Escalation increased', 'This is a repeated serious violation. I am increasing the intervention level because the behavior is continuing after prior warnings.', 'danger');
  }
}

function coachTextFor(riskEvent) {
  const stage = INTERVENTION_LEVELS[riskEvent.interventionLevel] || INTERVENTION_LEVELS[1];

  if (riskEvent.type === 'Possible revenge trading') {
    return `${stage.name}: ${riskEvent.message} Stop and explain the trade thesis before taking another entry. I recommend a cooldown now.`;
  }

  if (riskEvent.type === 'Daily loss limit breach') {
    return `${stage.name}: ${riskEvent.message} This is where discipline matters most. The correct action is to lock the session and protect capital.`;
  }

  if (riskEvent.type === 'Plan deviation') {
    return `${stage.name}: ${riskEvent.message} Your plan only works if we respect it during live pressure. What changed that justified this entry?`;
  }

  if (riskEvent.type === 'Cooldown trigger') {
    return `${stage.name}: ${riskEvent.message} No new entries until you have reset and can restate your plan clearly.`;
  }

  return `${stage.name}: ${riskEvent.message} Pause and confirm whether the next action still matches the plan.`;
}

function addCoachMessage(title, body, level) {
  const message = document.createElement('article');
  message.className = `message ${level}`;
  message.innerHTML = `<strong>${title}</strong><p>${body}</p><small>${nowLabel()}</small>`;
  elements.coachFeed.prepend(message);
}

function openCoachCheckIn(riskEvent) {
  if (state.session.coachCheckIn.isOpen) {
    return;
  }

  state.session.coachCheckIn = {
    isOpen: true,
    stepIndex: 0,
    reason: riskEvent.type,
    messages: [
      {
        role: 'coach',
        text: `${riskEvent.type}: ${COACH_CHECK_IN_STEPS[0]}`,
        time: nowLabel()
      }
    ]
  };
}

function sendCoachCheckInReply() {
  const checkIn = state.session.coachCheckIn;
  const reply = elements.coachCheckInInput.value.trim();

  if (!state.session.reflectionRequired || !checkIn.isOpen) {
    return;
  }

  if (reply.length < 3) {
    addCoachMessage('Check-in needs a reply', 'Give the coach one short, clear answer before continuing.', 'warning');
    recordEventLog('Coach Check-In', 'Reply was too short to continue the check-in.');
    return;
  }

  checkIn.messages.push({
    role: 'trader',
    text: reply,
    time: nowLabel()
  });
  elements.coachCheckInInput.value = '';

  if (checkIn.stepIndex < COACH_CHECK_IN_STEPS.length - 1) {
    checkIn.stepIndex += 1;
    checkIn.messages.push({
      role: 'coach',
      text: COACH_CHECK_IN_STEPS[checkIn.stepIndex],
      time: nowLabel()
    });
    recordEventLog('Coach Check-In', `Advanced to question ${checkIn.stepIndex + 1} of ${COACH_CHECK_IN_STEPS.length}.`);
    render();
    return;
  }

  completeCoachCheckIn();
  render();
}

function completeCoachCheckIn() {
  const checkIn = state.session.coachCheckIn;
  const currentLevel = state.session.escalationLevel;
  const currentIntervention = INTERVENTION_LEVELS[currentLevel] || INTERVENTION_LEVELS[0];
  const traderAnswers = checkIn.messages
    .filter((message) => message.role === 'trader')
    .map((message, index) => `Q${index + 1}: ${message.text}`)
    .join(' | ');

  state.session.reflectionHistory.unshift({
    time: nowLabel(),
    level: currentLevel,
    intervention: currentIntervention.name,
    text: traderAnswers
  });
  state.session.reflectionHistory = state.session.reflectionHistory.slice(0, 5);

  if (currentLevel >= 5) {
    state.session.reflectionRequired = true;
    checkIn.messages.push({
      role: 'coach',
      text: 'Check-in recorded. Because this session reached lockout recommendation, reset the session before simulating more trades.',
      time: nowLabel()
    });
    recordEventLog('Coach Check-In', 'Conversation completed, but lockout remains active.');
  } else {
    state.session.reflectionRequired = false;
    checkIn.messages.push({
      role: 'coach',
      text: 'Check-in complete. You can continue, but the elevated risk state remains visible.',
      time: nowLabel()
    });
    recordEventLog('Coach Check-In', 'Conversation completed and simulator trading is available again.');
  }

  checkIn.isOpen = false;
  addCoachMessage('Coach check-in complete', currentLevel >= 5
    ? 'The conversation is recorded, but lockout still recommends ending the session.'
    : 'The conversation is recorded. Continue only if the next trade matches the plan.', currentLevel >= 5 ? 'danger' : 'info');
}

function recordEventLog(stage, detail) {
  state.session.eventLog.unshift({
    time: nowLabel(),
    stage,
    detail
  });

  state.session.eventLog = state.session.eventLog.slice(0, 12);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function render() {
  const intervention = INTERVENTION_LEVELS[state.session.escalationLevel] || INTERVENTION_LEVELS[0];

  elements.appShell.dataset.focus = state.ui.focus;
  elements.sessionStatus.textContent = state.isLive ? 'Live Trading Session' : 'Session Idle';
  elements.sessionStatus.classList.toggle('live', state.isLive);
  elements.dailyPnl.textContent = money(state.session.dailyPnl);
  elements.dailyPnl.className = state.session.dailyPnl < 0 ? 'status-danger' : 'status-ok';
  elements.positionSize.textContent = `${state.session.positionSize} contracts`;
  elements.tradeCount.textContent = `${state.session.tradeCount} / ${state.plan.maxTrades}`;
  elements.lossStreak.textContent = state.session.lossStreak;
  elements.riskLevel.textContent = state.session.riskLevel;
  elements.riskSummary.textContent = state.session.riskSummary;
  elements.escalationLevel.textContent = `Level ${state.session.escalationLevel}: ${intervention.name}`;
  elements.adapterStatus.textContent = `${state.activeAdapterName} active. ${ProjectXAdapter.name}: ${ProjectXAdapter.status}. ${TradovateAdapter.name}: ${TradovateAdapter.status}.`;
  elements.interventionName.textContent = intervention.name;
  elements.interventionAction.textContent = intervention.action;
  elements.interventionStatus.className = `intervention-status ${intervention.className}`;
  renderCommandStrip(intervention);
  renderFocusTabs();
  renderRiskCockpit();
  renderRiskBudgetPreview();
  renderDisciplineLock();
  renderWeeklyReview();
  renderEndDayReview();
  renderApiConnections();

  elements.riskCard.className = 'risk-card';
  if (state.session.riskLevel === 'Elevated') elements.riskCard.classList.add('warning');
  if (state.session.riskLevel === 'High' || state.session.riskLevel === 'Critical') elements.riskCard.classList.add('danger');

  renderRules();
  renderBehavior();
  renderNextAction(intervention);
  renderReflectionGate();
  renderSessionTimeline();
  renderEventLog();
}

function renderFocusTabs() {
  elements.focusTabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.focus === state.ui.focus);
  });
}

function renderRiskCockpit() {
  const risk = calculateUiRiskState();

  elements.riskScore.textContent = risk.score;
  elements.riskRadar.className = `radar-card ${risk.level}`;
  elements.riskRadarText.textContent = risk.message;

  setHeatCell(elements.heatLoss, 'Loss', risk.lossLabel, risk.lossLevel);
  setHeatCell(elements.heatTrades, 'Trades', risk.tradeLabel, risk.tradeLevel);
  setHeatCell(elements.heatSize, 'Size', risk.sizeLabel, risk.sizeLevel);
  setHeatCell(elements.heatSetup, 'Setup', risk.setupLabel, risk.setupLevel);
  setHeatCell(elements.heatRevenge, 'Revenge', risk.revengeLabel, risk.revengeLevel);
  setHeatCell(elements.heatCooldown, 'Cooldown', risk.cooldownLabel, risk.cooldownLevel);
}

function calculateUiRiskState() {
  const session = state.session;
  const plan = state.plan;
  const dailyLoss = Math.abs(Math.min(session.dailyPnl, 0));
  const lossPercent = plan.maxDailyLoss > 0 ? dailyLoss / plan.maxDailyLoss : 0;
  const tradePercent = plan.maxTrades > 0 ? session.tradeCount / plan.maxTrades : 0;
  const lastEvent = session.events[session.events.length - 1];
  const offPlan = Boolean(lastEvent && !lastEvent.isApprovedSetup);
  const oversize = session.positionSize > plan.maxContracts;
  const cooldownPressure = session.lossStreak >= plan.cooldownAfterLosses;
  const revengePressure = session.escalationLevel >= 4 || (session.violationCounts['Possible revenge trading'] || 0) > 0;

  const score = Math.min(100, Math.round(
    (lossPercent * 35)
    + (tradePercent * 20)
    + (session.escalationLevel * 8)
    + (cooldownPressure ? 12 : 0)
    + (offPlan ? 12 : 0)
    + (oversize ? 12 : 0)
  ));
  const level = score >= 75 ? 'danger' : score >= 45 ? 'warning' : 'normal';

  return {
    score,
    level,
    message: level === 'danger'
      ? 'Risk pressure is high. The system is prioritizing capital protection.'
      : level === 'warning'
        ? 'Risk pressure is building. Slow execution and confirm the next action.'
        : 'Normal operating range.',
    lossLabel: lossPercent >= 1 ? 'Breach' : lossPercent >= 0.75 ? 'Near cap' : 'Stable',
    lossLevel: lossPercent >= 1 ? 'danger' : lossPercent >= 0.75 ? 'warning' : 'normal',
    tradeLabel: tradePercent >= 1 ? 'Maxed' : tradePercent >= 0.75 ? 'Tight' : 'Room',
    tradeLevel: tradePercent >= 1 ? 'danger' : tradePercent >= 0.75 ? 'warning' : 'normal',
    sizeLabel: oversize ? 'Breach' : 'Inside',
    sizeLevel: oversize ? 'danger' : 'normal',
    setupLabel: offPlan ? 'Off plan' : 'Aligned',
    setupLevel: offPlan ? 'danger' : 'normal',
    revengeLabel: revengePressure ? 'High' : session.escalationLevel >= 2 ? 'Watch' : 'Low',
    revengeLevel: revengePressure ? 'danger' : session.escalationLevel >= 2 ? 'warning' : 'normal',
    cooldownLabel: cooldownPressure ? 'Active' : session.lossStreak > 0 ? 'Watch' : 'Clear',
    cooldownLevel: cooldownPressure ? 'warning' : 'normal'
  };
}

function setHeatCell(element, label, value, level) {
  element.className = `heat-cell ${level}`;
  element.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
}

function renderCommandStrip(intervention) {
  const dailyLoss = Math.abs(Math.min(state.session.dailyPnl, 0));
  const riskPercentUsed = state.plan.maxDailyLoss > 0
    ? Math.min(100, Math.round((dailyLoss / state.plan.maxDailyLoss) * 100))
    : 0;
  const tradePercentUsed = state.plan.maxTrades > 0
    ? Math.min(100, Math.round((state.session.tradeCount / state.plan.maxTrades) * 100))
    : 0;

  elements.guardrailMode.textContent = state.disciplineLock.isLocked ? 'Weekly Plan Locked' : 'Plan Unlocked';
  elements.guardrailMode.className = state.disciplineLock.isLocked ? 'status-ok' : 'status-warn';
  elements.guardrailDetail.textContent = state.disciplineLock.isLocked
    ? 'Risk can be lowered, but not increased until Sunday check-in.'
    : 'Lock the weekly plan to prevent mid-session risk increases.';

  elements.riskUsedText.textContent = `${money(dailyLoss)} / ${money(state.plan.maxDailyLoss)}`;
  elements.riskUsedMeter.style.width = `${riskPercentUsed}%`;
  elements.riskUsedMeter.className = `meter-fill ${riskPercentUsed >= 100 ? 'danger' : riskPercentUsed >= 75 ? 'warning' : ''}`;

  elements.tradeCapacityText.textContent = `${state.session.tradeCount} / ${state.plan.maxTrades} trades`;
  elements.tradeCapacityMeter.style.width = `${tradePercentUsed}%`;
  elements.tradeCapacityMeter.className = `meter-fill ${tradePercentUsed >= 100 ? 'danger' : tradePercentUsed >= 75 ? 'warning' : ''}`;

  elements.coachStateBadge.textContent = intervention.name;
  elements.coachStateBadge.className = intervention.className === 'normal' ? 'status-ok' : intervention.className === 'warning' ? 'status-warn' : 'status-danger';
  elements.coachStateText.textContent = intervention.action;
}

function renderRiskBudgetPreview() {
  const riskPlan = calculateRiskPlan(currentRiskFormValues());
  const riskBudgetList = document.getElementById('riskBudgetList');

  elements.maxDailyLoss.value = riskPlan.maxDailyLoss;

  const rows = [
    ['Daily risk tier', `${riskPlan.tier.name} (${riskPlan.tier.dailyPercent}% of capital)`, true],
    ['Daily loss budget', money(riskPlan.maxDailyLoss), riskPlan.maxDailyLoss > 0],
    ['Max risk on one trade', `${money(riskPlan.plannedRiskPerTrade)} / ${money(riskPlan.maxDailyLoss)}`, riskPlan.oneTradeFits],
    ['Full planned day risk', `${money(riskPlan.plannedFullDayRisk)} / ${money(riskPlan.maxDailyLoss)}`, riskPlan.fullDayFits]
  ];

  riskBudgetList.innerHTML = rows.map(([name, value, ok]) => {
    const className = ok ? 'status-ok' : 'status-danger';
    const label = ok ? 'OK' : 'Too high';
    return `<li><span>${name}</span><strong class="${className}">${value} ${label}</strong></li>`;
  }).join('');
}

function renderDisciplineLock() {
  const locked = state.disciplineLock.isLocked;
  const limits = state.disciplineLock.lockedLimits;
  const weeklyCheckInOpen = isWeeklyCheckInOpen();
  const nextOpen = nextSundayLabel();

  elements.disciplineLockStatus.textContent = locked
    ? weeklyCheckInOpen
      ? 'Weekly Plan Locked - Sunday Check-In Open'
      : `Weekly Plan Locked - Opens ${nextOpen}`
    : 'Weekly Plan Unlocked';
  elements.disciplineLockStatus.className = locked ? 'status-danger' : 'status-ok';
  elements.lockWeeklyPlan.disabled = locked;
  elements.unlockWeeklyPlan.disabled = !locked || !weeklyCheckInOpen;

  const rows = locked && limits
    ? [
      ['Risk tier cap', `${RISK_TIERS[limits.riskTier].name} (${limits.dailyRiskPercent}%)`],
      ['Daily loss cap', money(limits.maxDailyLoss)],
      ['Risk per contract cap', money(limits.estimatedRiskPerContract)],
      ['Max contracts cap', limits.maxContracts],
      ['Max trades cap', limits.maxTrades],
      ['Weekly check-in', weeklyCheckInOpen ? 'Open today' : `Closed until ${nextOpen}`]
    ]
    : [
      ['Status', 'Lock the weekly plan to prevent midweek risk increases.'],
      ['Allowed while locked', 'Lower risk only.']
    ];

  elements.lockRulesList.innerHTML = rows.map(([name, value]) => `
    <li><span>${name}</span><strong>${value}</strong></li>
  `).join('');
}

function renderWeeklyReview() {
  const review = state.weeklyReview;
  const weeklyCheckInOpen = isWeeklyCheckInOpen();

  elements.weeklyReviewStatus.textContent = weeklyCheckInOpen
    ? 'Sunday check-in open'
    : `Preview mode - unlock opens ${nextSundayLabel()}`;

  if (!review) {
    elements.weeklyReviewRecommendation.textContent = 'Run review after a session.';
    elements.weeklyReviewRecommendation.className = '';
    elements.weeklyReviewList.innerHTML = `
      <li><span>Review mode</span><strong>${weeklyCheckInOpen ? 'Official check-in' : 'Prototype preview'}</strong></li>
      <li><span>Plan changes</span><strong>Manual approval required</strong></li>
    `;
    return;
  }

  elements.weeklyReviewRecommendation.textContent = review.recommendation;
  elements.weeklyReviewRecommendation.className = review.level === 'danger'
    ? 'status-danger'
    : review.level === 'warning'
      ? 'status-warn'
      : 'status-ok';

  elements.weeklyReviewList.innerHTML = review.rows.map(([name, value, ok]) => {
    const className = ok ? 'status-ok' : 'status-danger';
    return `<li><span>${name}</span><strong class="${className}">${escapeHtml(value)}</strong></li>`;
  }).join('');
}

function renderEndDayReview() {
  const review = state.endDayReview;

  elements.endDayReviewStatus.textContent = review ? 'Reviewed' : 'Not reviewed';

  if (!review) {
    elements.endDayReviewRecommendation.textContent = 'Run review after the session.';
    elements.endDayReviewRecommendation.className = '';
    elements.endDayReviewSummary.textContent = 'No session summary yet.';
    elements.endDayReviewList.innerHTML = `
      <li><span>Review mode</span><strong>Local session only</strong></li>
      <li><span>Broker action</span><strong>No real action</strong></li>
    `;
    return;
  }

  elements.endDayReviewRecommendation.textContent = review.recommendation;
  elements.endDayReviewRecommendation.className = review.level === 'danger'
    ? 'status-danger'
    : review.level === 'warning'
      ? 'status-warn'
      : 'status-ok';
  elements.endDayReviewSummary.textContent = review.summary;

  elements.endDayReviewList.innerHTML = review.rows.map(([name, value, ok]) => {
    const className = ok ? 'status-ok' : 'status-danger';
    return `<li><span>${name}</span><strong class="${className}">${escapeHtml(value)}</strong></li>`;
  }).join('');
}

function renderApiConnections() {
  elements.apiServerStatus.textContent = state.auth.localPrototypeMode
    ? 'Prototype mode'
    : state.api.serverOnline
      ? state.auth.configured
        ? 'Signed in'
        : 'Backend online'
      : 'Backend offline';
  elements.apiServerStatus.className = state.api.serverOnline ? 'status-ok' : 'status-danger';
  elements.openAiApiStatus.textContent = state.api.openAiConfigured
    ? state.api.voiceConnected
      ? 'Voice connected'
      : 'Configured'
    : 'Not configured';
  elements.openAiApiStatus.className = state.api.openAiConfigured ? 'status-ok' : 'status-warn';
  elements.projectXApiStatus.textContent = state.api.projectXConfigured
    ? state.api.projectXConnected
      ? 'Connected'
      : 'Configured'
    : 'Not configured';
  elements.projectXApiStatus.className = state.api.projectXConnected
    ? 'status-ok'
    : state.api.projectXConfigured
      ? 'status-warn'
      : 'status-warn';
  elements.toggleVoiceCoach.textContent = state.api.voiceConnected ? 'Stop Voice Coach' : 'Start Voice Coach';
  elements.connectProjectX.disabled = !state.api.serverOnline;
  elements.syncProjectXReadOnly.disabled = !state.api.serverOnline;
}

function renderRules() {
  const dailyLoss = Math.abs(Math.min(state.session.dailyPnl, 0));
  const rules = [
    ['Max daily loss', `${money(-dailyLoss)} / ${money(-state.plan.maxDailyLoss)}`, dailyLoss < state.plan.maxDailyLoss],
    ['Max contracts', `${state.session.positionSize} / ${state.plan.maxContracts}`, state.session.positionSize <= state.plan.maxContracts],
    ['Max trades', `${state.session.tradeCount} / ${state.plan.maxTrades}`, state.session.tradeCount <= state.plan.maxTrades],
    ['Cooldown after losses', `${state.session.lossStreak} / ${state.plan.cooldownAfterLosses}`, state.session.lossStreak < state.plan.cooldownAfterLosses]
  ];

  elements.rulesList.innerHTML = rules.map(([name, value, ok]) => {
    const className = ok ? 'status-ok' : 'status-danger';
    const label = ok ? 'OK' : 'Breach';
    return `<li><span>${name}</span><strong class="${className}">${value} ${label}</strong></li>`;
  }).join('');
}

function renderBehavior() {
  const lastEvent = state.session.events[state.session.events.length - 1];
  const lastSetupStatus = !lastEvent || lastEvent.isApprovedSetup ? 'On plan' : 'Off plan';
  const revengeRisk = state.session.escalationLevel >= 4 ? 'High' : state.session.escalationLevel >= 2 ? 'Watch' : 'Low';
  const overtradeRisk = state.session.tradeCount > state.plan.maxTrades * 0.75 ? 'Watch' : 'Low';

  const rows = [
    ['Setup discipline', lastSetupStatus, lastSetupStatus === 'On plan'],
    ['Revenge risk', revengeRisk, revengeRisk !== 'High'],
    ['Overtrading risk', overtradeRisk, overtradeRisk === 'Low'],
    ['Emotional control', state.session.escalationLevel >= 3 ? 'Pressured' : 'Calm', state.session.escalationLevel < 3]
  ];

  elements.behaviorList.innerHTML = rows.map(([name, value, ok]) => {
    const className = ok ? 'status-ok' : value === 'Watch' ? 'status-warn' : 'status-danger';
    return `<li><span>${name}</span><strong class="${className}">${value}</strong></li>`;
  }).join('');
}

function renderNextAction(intervention) {
  const dailyLoss = Math.abs(Math.min(state.session.dailyPnl, 0));
  const dailyBudgetUsed = state.plan.maxDailyLoss > 0 ? dailyLoss / state.plan.maxDailyLoss : 0;
  let level = 'normal';
  let title = 'Wait for an approved setup.';
  let text = 'Stay patient. The next trade should match the pre-market plan, size cap, and daily risk budget.';

  if (!state.isLive) {
    title = 'Start with the plan.';
    text = 'Save the pre-market plan, then start the session when ready.';
  } else if (state.session.escalationLevel >= 5) {
    level = 'danger';
    title = 'Stop trading for this session.';
    text = 'Lockout is recommended. Reset only after reviewing what happened and protecting capital.';
  } else if (state.session.reflectionRequired) {
    level = 'warning';
    title = 'Complete the coach check-in.';
    text = 'Trading is paused until the active check-in conversation is completed.';
  } else if (state.session.tradeCount >= state.plan.maxTrades) {
    level = 'danger';
    title = 'Daily trade limit reached.';
    text = 'No more entries today unless the weekly plan changes during an allowed check-in.';
  } else if (dailyBudgetUsed >= 0.75) {
    level = 'warning';
    title = 'Protect the remaining risk budget.';
    text = 'You are close to the daily loss limit. Reduce pressure and wait for only the cleanest setup.';
  } else if (state.session.lossStreak >= state.plan.cooldownAfterLosses) {
    level = 'warning';
    title = 'Take the planned cooldown.';
    text = 'The loss-streak rule is active. Pause before considering another entry.';
  } else if (intervention.className !== 'normal') {
    level = 'warning';
    title = intervention.name;
    text = intervention.action;
  }

  elements.nextActionCard.className = `next-action-card ${level}`;
  elements.nextActionTitle.textContent = title;
  elements.nextActionText.textContent = text;
}

function renderSessionTimeline() {
  if (state.session.events.length === 0) {
    elements.sessionTimeline.innerHTML = '<li class="timeline-empty">No trades in this session yet.</li>';
    return;
  }

  elements.sessionTimeline.innerHTML = state.session.events.slice(-5).reverse().map((event) => {
    const pnlClass = event.realizedPnl < 0 ? 'status-danger' : 'status-ok';
    const setupClass = event.isApprovedSetup ? 'status-ok' : 'status-danger';

    return `
      <li>
        <div>
          <span>${event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <strong>${escapeHtml(event.action || 'trade event')}</strong>
          <p>${escapeHtml(event.setup)} - ${event.positionSize} contract${event.positionSize === 1 ? '' : 's'}</p>
        </div>
        <div class="timeline-result">
          <strong class="${pnlClass}">${money(event.realizedPnl)}</strong>
          <small class="${setupClass}">${event.isApprovedSetup ? 'Approved' : 'Off plan'}</small>
        </div>
      </li>
    `;
  }).join('');
}

function renderEventLog() {
  const entries = filteredEventLog();

  elements.logFilters.forEach((button) => {
    button.classList.toggle('active', button.dataset.logFilter === state.ui.logFilter);
  });

  if (entries.length === 0) {
    elements.eventLog.innerHTML = '<li class="event-log-empty">No events recorded yet.</li>';
    return;
  }

  elements.eventLog.innerHTML = entries.map((entry) => `
    <li>
      <span>${escapeHtml(entry.time)}</span>
      <strong>${escapeHtml(entry.stage)}</strong>
      <p>${escapeHtml(entry.detail)}</p>
    </li>
  `).join('');
}

function filteredEventLog() {
  const filter = state.ui.logFilter;

  if (filter === 'all') {
    return state.session.eventLog;
  }

  return state.session.eventLog.filter((entry) => {
    const stage = entry.stage.toLowerCase();

    if (filter === 'trade') {
      return stage.includes('simulator') || stage.includes('projectx') || stage.includes('trading event');
    }

    if (filter === 'risk') {
      return stage.includes('rules') || stage.includes('intervention') || stage.includes('risk') || stage.includes('coach check-in');
    }

    if (filter === 'api') {
      return stage.includes('api') || stage.includes('openai') || stage.includes('voice');
    }

    return true;
  });
}

function renderReflectionGate() {
  const currentLevel = state.session.escalationLevel;
  const lockedOut = currentLevel >= 5;
  const checkIn = state.session.coachCheckIn;
  const gateActive = state.session.reflectionRequired || lockedOut;
  const status = lockedOut
    ? 'Lockout recommended. Reset session before continuing.'
    : gateActive
      ? 'Coach check-in required before next simulator trade.'
      : 'No check-in required.';

  elements.reflectionGate.classList.toggle('active', gateActive);
  elements.reflectionGate.classList.toggle('lockout', lockedOut);
  elements.reflectionStatus.textContent = status;
  elements.sendCheckInReply.disabled = !gateActive || !checkIn.isOpen;
  elements.coachCheckInInput.disabled = !gateActive || !checkIn.isOpen;
  renderCoachCheckInThread();

  [elements.plannedWin, elements.plannedLoss, elements.oversizeTrade, elements.revengeTrade].forEach((button) => {
    button.disabled = gateActive;
  });

  if (state.session.reflectionHistory.length === 0) {
    elements.reflectionHistory.innerHTML = '<li>No check-ins recorded yet.</li>';
    return;
  }

  elements.reflectionHistory.innerHTML = state.session.reflectionHistory.map((entry) => `
    <li>
      <span>${escapeHtml(entry.time)} - Level ${escapeHtml(entry.level)} ${escapeHtml(entry.intervention)}</span>
      <p>${escapeHtml(entry.text)}</p>
    </li>
  `).join('');
}

function renderCoachCheckInThread() {
  const checkIn = state.session.coachCheckIn;

  if (checkIn.messages.length === 0) {
    elements.coachCheckInThread.innerHTML = '<p class="coach-check-in-empty">No active coach check-in.</p>';
    return;
  }

  elements.coachCheckInThread.innerHTML = checkIn.messages.map((message) => `
    <article class="coach-turn ${message.role}">
      <strong>${message.role === 'coach' ? 'Coach' : 'Trader'}</strong>
      <p>${escapeHtml(message.text)}</p>
      <small>${escapeHtml(message.time)}</small>
    </article>
  `).join('');
}

function tickClock() {
  elements.clock.textContent = nowLabel();
}

elements.planForm.addEventListener('submit', savePlan);
[elements.accountCapital, elements.riskTier, elements.estimatedRiskPerContract, elements.maxContracts, elements.maxTrades].forEach((field) => {
  field.addEventListener('input', renderRiskBudgetPreview);
  field.addEventListener('change', renderRiskBudgetPreview);
});
elements.lockWeeklyPlan.addEventListener('click', lockWeeklyPlan);
elements.unlockWeeklyPlan.addEventListener('click', unlockWeeklyPlan);
elements.runWeeklyReview.addEventListener('click', runWeeklyReview);
elements.runEndDayReview.addEventListener('click', runEndDayReview);
elements.refreshApiStatus.addEventListener('click', refreshApiStatus);
elements.toggleVoiceCoach.addEventListener('click', toggleVoiceCoach);
elements.connectProjectX.addEventListener('click', connectProjectXApi);
elements.syncProjectXReadOnly.addEventListener('click', syncProjectXReadOnlyData);
elements.startSession.addEventListener('click', startSession);
elements.syncProjectXMock.addEventListener('click', syncProjectXMockData);
elements.plannedWin.addEventListener('click', () => simulateTrade('plannedWin'));
elements.plannedLoss.addEventListener('click', () => simulateTrade('plannedLoss'));
elements.oversizeTrade.addEventListener('click', () => simulateTrade('oversizeTrade'));
elements.revengeTrade.addEventListener('click', () => simulateTrade('revengeTrade'));
elements.resetSession.addEventListener('click', resetSession);
elements.sendCheckInReply.addEventListener('click', sendCoachCheckInReply);
elements.coachCheckInInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendCoachCheckInReply();
  }
});
elements.focusTabs.forEach((button) => {
  button.addEventListener('click', () => {
    state.ui.focus = button.dataset.focus || 'overview';
    render();
  });
});
elements.logFilters.forEach((button) => {
  button.addEventListener('click', () => {
    state.ui.logFilter = button.dataset.logFilter || 'all';
    renderEventLog();
  });
});

setInterval(tickClock, 1000);
tickClock();
addCoachMessage('Coach ready', 'Save your plan, start the session, and use simulator events to test live behavioral interventions.', 'info');
initializeAuth();
