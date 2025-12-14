# ProbPilot Project Documentation

## Inspiration

ProbPilot was inspired by the need for evidence-based forecasting in prediction markets. Traditional platforms show market odds but lack transparent, AI-driven analysis that incorporates real-world evidence. We wanted to create a tool that helps analysts make more informed decisions by scanning news, classifying stances, and generating model probabilities against live market odds.

## What it does

ProbPilot is an evidence-aware forecasting copilot that:

- **Scans news and evidence** using Tavily search API to gather relevant information about prediction market events
- **Classifies evidence stances** (supports/contradicts/neutral) using Groq AI models with confidence scoring
- **Generates model probabilities** that adjust market odds based on collected evidence
- **Provides trading recommendations** (BUY YES/BUY NO/HOLD) with confidence levels and rationale
- **Tracks forecast history** with detailed drivers and evidence sources
- **Manages user entitlements** with tiered access to forecasts and evidence scans
- **Integrates live market data** from Polymarket and Kalshi prediction exchanges

## How we built it

**Frontend:** Built with React 18, TypeScript, and Vite for fast development and optimized builds. Used Tailwind CSS with shadcn/ui components for a modern, accessible interface.

**Backend:** Express.js API server handling forecast generation and evidence scanning. Integrated Groq SDK for AI-powered analysis and Tavily API for web search.

**Database:** Supabase PostgreSQL with Row Level Security for user data isolation. Tables for forecasts, watchlists, user profiles, and entitlements.

**AI Pipeline:** Two-step process - first Tavily searches for relevant articles, then Groq LLM classifies evidence stances and generates probability adjustments.

**Market Integration:** Proxy configuration in Vite to fetch live data from Polymarket and Kalshi APIs, with real-time market odds and volume data.

**Authentication & Billing:** Supabase Auth for user management, Flowglad for payment processing with tiered subscription plans.

## Challenges we ran into

**AI Model Consistency:** Getting Groq to consistently return valid JSON without refusing to make forecasts due to "insufficient evidence" - solved with strict system prompts and fallback mechanisms.

**Evidence Classification:** Accurately classifying article stances relative to prediction market outcomes - required careful prompt engineering and stance taxonomy.

**Rate Limiting:** Managing API limits across multiple services (Tavily, Groq, market APIs) - implemented usage tracking and entitlement system.

**Real-time Data:** Keeping market data synchronized while handling API rate limits - used React Query for caching and optimistic updates.

**Security:** Implementing proper Row Level Security in Supabase to ensure users only see their own data while allowing efficient queries.

## Accomplishments that we're proud of

**Evidence-Aware Forecasting:** Successfully built an end-to-end pipeline that turns web content into actionable trading signals with transparent rationale.

**User Experience:** Created an intuitive dashboard that shows forecast usage, market trends, and detailed analysis with confidence indicators.

**Scalable Architecture:** Designed a system that can handle multiple users with tiered access while maintaining data security and API efficiency.

**AI Reliability:** Achieved consistent AI model performance with proper error handling, fallback mechanisms, and output validation.

**Market Integration:** Successfully integrated two major prediction market APIs with real-time data fetching and proper error handling.

## What we learned

**Prompt Engineering:** Critical importance of precise system prompts and output validation when working with AI models for financial applications.

**API Design:** Value of building resilient APIs with proper error handling, rate limiting, and fallback mechanisms.

**User Psychology:** Users need transparency in AI-driven recommendations - showing evidence sources and confidence levels builds trust.

**Performance Tradeoffs:** Balancing real-time data freshness with API costs and user experience requires careful optimization.

**Security First:** Row Level Security and proper data isolation should be designed from the start, not added later.

## What's next for ProbPilot

**Advanced AI Models:** Integration of larger language models for better evidence classification and forecast accuracy.

**Multi-Exchange Support:** Expanding to additional prediction markets and decentralized exchanges.

**Portfolio Management:** Tools for tracking multiple positions and portfolio-level risk management.

**Mobile Application:** Native mobile app for on-the-go forecasting and market monitoring.

**Social Features:** Community forecasts, leaderboards, and collaborative analysis tools.

**Advanced Analytics:** Historical performance tracking, backtesting capabilities, and strategy optimization tools.

**Enterprise Features:** Team accounts, API access for institutional clients, and custom integrations.
