#!/usr/bin/env node

/**
 * API Keys Sanity Check Script for OnePromptPortfolio V2
 * Tests all three AI providers to ensure API keys are working
 */

import { readFileSync } from 'fs';

// Simple env file parser (avoiding external dependencies)
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

// Load environment variables
process.env = { ...process.env, ...envVars };

const API_KEYS = {
  openai: process.env.VITE_OPENAI_API_KEY,
  anthropic: process.env.VITE_ANTHROPIC_API_KEY,
  gemini: process.env.VITE_GEMINI_API_KEY
};

// Simple test message
const TEST_MESSAGE = "Hello! Please respond with exactly: 'API test successful'";

// Test results storage
const results = {
  openai: { status: 'pending', error: null, response: null },
  anthropic: { status: 'pending', error: null, response: null },
  gemini: { status: 'pending', error: null, response: null }
};

/**
 * Test OpenAI API
 */
async function testOpenAI() {
  if (!API_KEYS.openai || API_KEYS.openai.includes('your_')) {
    results.openai = { status: 'failed', error: 'Invalid API key format', response: null };
    return;
  }

  try {
    console.log('🔵 Testing OpenAI API...');
    const response = await globalThis.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEYS.openai}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: TEST_MESSAGE }],
        max_tokens: 50,
        temperature: 0
      })
    });

    if (!response.ok) {
      const error = await response.text();
      results.openai = { status: 'failed', error: `HTTP ${response.status}: ${error}`, response: null };
      return;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No response';
    
    results.openai = { 
      status: 'success', 
      error: null, 
      response: aiResponse,
      model: data.model,
      usage: data.usage
    };
  } catch (error) {
    results.openai = { status: 'failed', error: error.message, response: null };
  }
}

/**
 * Test Anthropic (Claude) API
 */
async function testAnthropic() {
  if (!API_KEYS.anthropic || API_KEYS.anthropic.includes('your_')) {
    results.anthropic = { status: 'failed', error: 'Invalid API key format', response: null };
    return;
  }

  try {
    console.log('🟠 Testing Anthropic (Claude) API...');
    const response = await globalThis.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEYS.anthropic,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 50,
        messages: [{ role: 'user', content: TEST_MESSAGE }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      results.anthropic = { status: 'failed', error: `HTTP ${response.status}: ${error}`, response: null };
      return;
    }

    const data = await response.json();
    const aiResponse = data.content?.[0]?.text || 'No response';
    
    results.anthropic = { 
      status: 'success', 
      error: null, 
      response: aiResponse,
      model: data.model,
      usage: data.usage
    };
  } catch (error) {
    results.anthropic = { status: 'failed', error: error.message, response: null };
  }
}

/**
 * Test Google Gemini API
 */
async function testGemini() {
  if (!API_KEYS.gemini || API_KEYS.gemini.includes('your_')) {
    results.gemini = { status: 'failed', error: 'Invalid API key format', response: null };
    return;
  }

  try {
    console.log('🔴 Testing Google Gemini API...');
    const response = await globalThis.fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEYS.gemini}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: TEST_MESSAGE }]
        }],
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      results.gemini = { status: 'failed', error: `HTTP ${response.status}: ${error}`, response: null };
      return;
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    
    results.gemini = { 
      status: 'success', 
      error: null, 
      response: aiResponse,
      usage: data.usageMetadata
    };
  } catch (error) {
    results.gemini = { status: 'failed', error: error.message, response: null };
  }
}

/**
 * Print formatted results
 */
function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 API KEYS SANITY CHECK RESULTS');
  console.log('='.repeat(60));
  
  let allSuccess = true;
  
  Object.entries(results).forEach(([provider, result]) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    
    console.log(`\n${icon} ${providerName}:`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    if (result.status === 'success') {
      console.log(`   Response: "${result.response}"`);
      if (result.model) console.log(`   Model: ${result.model}`);
      if (result.usage) console.log(`   Usage: ${JSON.stringify(result.usage)}`);
    } else {
      console.log(`   Error: ${result.error}`);
      allSuccess = false;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (allSuccess) {
    console.log('🎉 ALL API KEYS ARE WORKING! Your V2 terminal is ready for AI features.');
  } else {
    console.log('⚠️  Some API keys have issues. Check the errors above.');
  }
  
  console.log('='.repeat(60) + '\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting API Keys Sanity Check...\n');
  
  // Test all APIs in parallel
  await Promise.all([
    testOpenAI(),
    testAnthropic(),
    testGemini()
  ]);
  
  // Print results
  printResults();
  
  // Return appropriate exit code
  const hasFailures = Object.values(results).some(r => r.status === 'failed');
  process.exit(hasFailures ? 1 : 0);
}

// Run the test
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});