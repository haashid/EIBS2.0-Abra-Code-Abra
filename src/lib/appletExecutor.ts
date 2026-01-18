// Client-side applet execution simulator
// This simulates WASM applet execution for demo purposes

export interface AppletExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  executionTime: number;
  txHash?: string;
}

// Sentiment Analysis Implementation
function analyzeSentiment(text: string): any {
  const textLower = text.toLowerCase();
  
  const positiveWords = [
    "good", "great", "excellent", "amazing", "wonderful", "fantastic",
    "love", "best", "perfect", "awesome", "brilliant", "outstanding",
    "happy", "joy", "delighted", "pleased", "satisfied", "beautiful"
  ];
  
  const negativeWords = [
    "bad", "terrible", "awful", "horrible", "worst", "hate",
    "poor", "disappointing", "useless", "waste", "disgusting",
    "sad", "angry", "frustrated", "annoyed", "upset", "disappointed"
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    const matches = textLower.match(new RegExp(word, 'g'));
    positiveCount += matches ? matches.length : 0;
  });
  
  negativeWords.forEach(word => {
    const matches = textLower.match(new RegExp(word, 'g'));
    negativeCount += matches ? matches.length : 0;
  });
  
  const totalSentimentWords = positiveCount + negativeCount;
  
  if (totalSentimentWords === 0) {
    return {
      sentiment: "neutral",
      score: 0.0,
      confidence: 0.5,
      details: "No strong sentiment indicators found"
    };
  }
  
  const posRatio = positiveCount / totalSentimentWords;
  const negRatio = negativeCount / totalSentimentWords;
  const score = posRatio - negRatio;
  const confidence = Math.min(totalSentimentWords / 10, 1.0);
  
  const sentiment = score > 0.2 ? "positive" : score < -0.2 ? "negative" : "neutral";
  
  return {
    sentiment,
    score: Math.round(score * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    positiveWords: positiveCount,
    negativeWords: negativeCount
  };
}

// Text Summarization Implementation (simple extractive summary)
function summarizeText(text: string): string {
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  
  if (sentences.length <= 2) {
    return text;
  }
  
  // Simple extractive summarization: take first and last sentences
  const summary = sentences.length > 3
    ? `${sentences[0].trim()} ${sentences[sentences.length - 1].trim()}`
    : sentences.slice(0, 2).join(' ').trim();
  
  return summary;
}

// Text Length Counter
function countWords(text: string): any {
  const words = text.trim().split(/\s+/);
  const characters = text.length;
  const sentences = (text.match(/[\.!\?]+/g) || []).length;
  
  return {
    words: words.length,
    characters,
    sentences,
    averageWordLength: Math.round((characters / words.length) * 10) / 10
  };
}

// Keyword Extractor
function extractKeywords(text: string): any {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  const sorted = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  return {
    keywords: sorted.map(([word, count]) => ({ word, count })),
    totalUniqueWords: Object.keys(frequency).length
  };
}

// Main execution function
export async function executeApplet(
  appletId: number,
  appletName: string,
  input: string
): Promise<AppletExecutionResult> {
  const startTime = Date.now();
  
  try {
    let output: any;
    
    switch (appletName.toLowerCase()) {
      case "sentiment analyzer":
        output = analyzeSentiment(input);
        break;
        
      case "text summarizer":
        output = { summary: summarizeText(input) };
        break;
        
      case "word counter":
        output = countWords(input);
        break;
        
      case "keyword extractor":
        output = extractKeywords(input);
        break;
        
      default:
        throw new Error(`Unknown applet: ${appletName}`);
    }
    
    const executionTime = Date.now() - startTime;
    
    // Generate a mock transaction hash
    const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
    
    return {
      success: true,
      output,
      executionTime,
      txHash
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

// Execute a pipeline of applets
export async function executePipeline(
  applets: Array<{ id: number; name: string }>,
  initialInput: string
): Promise<{
  success: boolean;
  results: AppletExecutionResult[];
  finalOutput: any;
  totalCost: bigint;
  txHash: string;
}> {
  const results: AppletExecutionResult[] = [];
  let currentInput = initialInput;
  
  for (const applet of applets) {
    const result = await executeApplet(applet.id, applet.name, currentInput);
    results.push(result);
    
    if (!result.success) {
      return {
        success: false,
        results,
        finalOutput: null,
        totalCost: BigInt(0),
        txHash: ""
      };
    }
    
    // Use output as input for next applet
    currentInput = typeof result.output === 'string' 
      ? result.output 
      : JSON.stringify(result.output);
  }
  
  // Generate pipeline transaction hash
  const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
  
  return {
    success: true,
    results,
    finalOutput: results[results.length - 1].output,
    totalCost: BigInt(applets.length) * BigInt(10000000000000000), // 0.01 ETH per applet
    txHash
  };
}
