import hashlib
import re

CATEGORY_PATTERNS = {
    "btc_regime": [
        r"bitcoin", r"\bbtc\b", r"bull market", r"bear market",
        r"weekly close", r"market regime", r"cycle"
    ],
    "moving_averages": [
        r"50[- ]?week", r"200[- ]?week", r"21[- ]?week",
        r"200[- ]?day", r"moving average", r"\bema\b", r"\bsma\b"
    ],
    "macro": [
        r"federal reserve", r"\bfed\b", r"liquidity", r"\bm2\b",
        r"inflation", r"\bcpi\b", r"\bpce\b", r"treasury",
        r"bond yield", r"\bdxy\b", r"dollar index", r"nasdaq", r"oil"
    ],
    "entry": [
        r"\bbuy\b", r"buying", r"entry", r"accumulat", r"retest",
        r"breakout", r"support", r"ladder", r"tranche", r"\bdca\b"
    ],
    "exit": [
        r"\bsell\b", r"selling", r"take profit", r"exit",
        r"profit target", r"deadline", r"rotate"
    ],
    "risk": [
        r"risk", r"position size", r"stop loss", r"stop-loss",
        r"liquidat", r"drawdown", r"full port", r"all[- ]?in"
    ],
    "futures": [
        r"futures", r"perpetual", r"\bperp\b", r"leverage",
        r"funding", r"\blong\b", r"\bshort\b", r"grid"
    ],
    "alt_relative": [
        r"against bitcoin", r"versus bitcoin", r"relative strength",
        r"volatility multiplier", r"downside capture", r"\bbeta\b",
        r"correlation", r"bitcoin dominance", r"total2"
    ],
    "narrative": [
        r"narrative", r"ecosystem", r"catalyst", r"tokenization",
        r"\brwa\b", r"privacy", r"\bai\b", r"gaming", r"memecoin"
    ],
    "liquidity": [
        r"liquidity", r"slippage", r"order book", r"market depth",
        r"volume", r"open interest"
    ],
}

ASSET_PATTERNS = {
    "BTC": [r"bitcoin", r"\bbtc\b"],
    "ETH": [r"ethereum", r"\beth\b"],
    "SOL": [r"solana", r"\bsol\b"],
    "XRP": [r"\bxrp\b"],
    "BNB": [r"\bbnb\b"],
    "DOGE": [r"dogecoin", r"\bdoge\b"],
    "LINK": [r"chainlink", r"\blink\b"],
    "AVAX": [r"avalanche", r"\bavax\b"],
    "ADA": [r"cardano", r"\bada\b"],
    "NEAR": [r"\bnear\b"],
    "ZEC": [r"zcash", r"\bzec\b"],
    "XMR": [r"monero", r"\bxmr\b"],
    "HYPE": [r"hyperliquid", r"\bhype\b"],
    "TAO": [r"bittensor", r"\btao\b"],
}

RULE_PATTERNS = {
    "wait_for_weekly_confirmation": [
        r"wait.{0,40}weekly close", r"weekly close.{0,40}confirm",
        r"wait.{0,40}confirmation"
    ],
    "bitcoin_as_core": [
        r"hold bitcoin", r"bitcoin.{0,35}(?:core|majority|portfolio)",
        r"(?:50|half).{0,20}portfolio.{0,30}bitcoin"
    ],
    "altcoins_as_temporary_trades": [
        r"altcoins?.{0,50}(?:trade|temporary|three months)",
        r"do not hold.{0,40}altcoin", r"never hold.{0,40}altcoin"
    ],
    "three_month_altcoin_horizon": [
        r"altcoin.{0,60}three months", r"three months.{0,60}altcoin"
    ],
    "avoid_high_leverage": [
        r"avoid.{0,30}high leverage", r"high leverage.{0,30}(?:avoid|danger)",
        r"below 10x", r"less than 10x"
    ],
    "macro_liquidity_matters": [
        r"macro.{0,40}(?:matter|important)", r"global liquidity",
        r"m2.{0,40}bitcoin", r"fed balance sheet"
    ],
    "measure_alts_vs_btc": [
        r"altcoin.{0,60}(?:against|versus) bitcoin",
        r"volatility multiplier.{0,50}bitcoin",
        r"downside capture", r"relative strength.{0,40}bitcoin"
    ],
    "use_50w_for_confirmation": [
        r"50[- ]?week.{0,80}confirm", r"confirm.{0,80}50[- ]?week"
    ],
    "use_200w_for_value": [
        r"200[- ]?week.{0,80}(?:cheap|buy|accumulat|bottom|value)",
        r"(?:cheap|buy|accumulat|bottom|value).{0,80}200[- ]?week"
    ],
    "buy_in_tranches": [
        r"buy.{0,40}tranche", r"tranche.{0,40}buy", r"ladder.{0,40}(?:in|buy)"
    ],
    "target_and_time_deadline": [
        r"target.{0,70}deadline", r"take profit.{0,70}time frame",
        r"maximum time.{0,50}hold"
    ],
}

def _count_patterns(text, patterns):
    return sum(len(re.findall(p, text, flags=re.I)) for p in patterns)

def analyze_text(text):
    normalized = re.sub(r"\s+", " ", text or "").strip()
    low = normalized.lower()
    category_counts = {
        name: _count_patterns(low, pats)
        for name, pats in CATEGORY_PATTERNS.items()
    }
    assets = [
        name for name, pats in ASSET_PATTERNS.items()
        if _count_patterns(low, pats) > 0
    ]
    rules = {
        name: any(re.search(p, low, flags=re.I) for p in pats)
        for name, pats in RULE_PATTERNS.items()
    }

    leverage = sorted(set(re.findall(r"\b(?:1|2|3|5|10|20|25|50|100)x\b", low)))
    percentages = sorted(set(re.findall(r"\b\d{1,3}(?:\.\d+)?%", normalized)))
    prices = sorted(set(re.findall(r"\$\s?\d[\d,]*(?:\.\d+)?\s?[kKmMbB]?", normalized)))
    timeframes = sorted(set(re.findall(
        r"\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+"
        r"(?:minute|hour|day|week|month|year)s?\b", low
    )))
    indicators = []
    for label, pat in [
        ("50W SMA/EMA", r"50[- ]?week"),
        ("200W SMA", r"200[- ]?week"),
        ("21W EMA", r"21[- ]?week"),
        ("200D MA", r"200[- ]?day"),
        ("RSI", r"\brsi\b"),
        ("EMA", r"\bema\b"),
        ("SMA", r"\bsma\b"),
        ("Bitcoin dominance", r"bitcoin dominance"),
        ("TOTAL2", r"\btotal2\b"),
        ("M2 liquidity", r"\bm2\b"),
    ]:
        if re.search(pat, low):
            indicators.append(label)

    action_counts = {
        "buy": len(re.findall(r"\b(?:buy|buying|bought)\b", low)),
        "sell": len(re.findall(r"\b(?:sell|selling|sold)\b", low)),
        "hold": len(re.findall(r"\b(?:hold|holding|held)\b", low)),
        "wait": len(re.findall(r"\b(?:wait|waiting)\b", low)),
        "short": len(re.findall(r"\bshort(?:ing|ed)?\b", low)),
        "long": len(re.findall(r"\blong(?:ing|ed)?\b", low)),
    }

    return {
        "transcript_sha256": hashlib.sha256(normalized.encode("utf-8")).hexdigest(),
        "word_count": len(normalized.split()),
        "category_counts": category_counts,
        "assets": assets,
        "rule_flags": rules,
        "leverage_mentions": leverage[:20],
        "percentage_mentions": percentages[:40],
        "price_mentions": prices[:80],
        "time_horizon_mentions": timeframes[:40],
        "indicators": indicators,
        "action_counts": action_counts,
    }
