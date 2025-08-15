const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '.data');
const portfoliosFile = path.join(DATA_DIR, 'portfolios.json');
const allocationsFile = path.join(DATA_DIR, 'allocations.json');
const pairsFile = path.join(DATA_DIR, 'pairs.json');
const exchangeKeysFile = path.join(DATA_DIR, 'exchangeKeys.json');

function readJson(file, def){
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch(e){
    return def;
  }
}

function writeJson(file, data){
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getExchangeKey(id){
  const keys = readJson(exchangeKeysFile, []);
  return keys.find(k => k.id === id);
}

// List portfolios
router.get('/', (req,res)=>{
  const portfolios = readJson(portfoliosFile, []);
  const allocations = readJson(allocationsFile, {});
  const pairs = readJson(pairsFile, {});
  const items = portfolios.map(p => ({
    ...p,
    allocPercent: (allocations[p.id]||[]).reduce((s,a)=>s+a.percent,0),
    pairsCount: (pairs[p.id]||[]).length
  }));
  res.json({items, page:1, pageSize:items.length, total:items.length});
});

// Create portfolio
router.post('/', (req,res)=>{
  const {name, exchangeKeyId, baseCurrency, budget} = req.body;
  const portfolios = readJson(portfoliosFile, []);
  if(!name){
    return res.status(400).json({error:{code:'VALIDATION_ERROR', message:'name required'}});
  }
  if(portfolios.some(p=>p.name===name)){
    return res.status(400).json({error:{code:'VALIDATION_ERROR', message:'name must be unique'}});
  }
  if(!(budget>0)){
    return res.status(400).json({error:{code:'VALIDATION_ERROR', message:'budget must be > 0'}});
  }
  const key = getExchangeKey(exchangeKeyId);
  if(!key){
    return res.status(400).json({error:{code:'EXCHANGEKEY_NOT_FOUND', message:'exchangeKey not found'}});
  }
  const id = `pf_${Date.now()}`;
  const portfolio = {id, name, exchangeKeyId, exchange:key.exchange, baseCurrency:baseCurrency||key.baseCurrency, budget};
  portfolios.push(portfolio);
  writeJson(portfoliosFile, portfolios);
  res.status(201).json({id});
});

// Get portfolio detail
router.get('/:id', (req,res)=>{
  const {id} = req.params;
  const portfolios = readJson(portfoliosFile, []);
  const portfolio = portfolios.find(p=>p.id===id);
  if(!portfolio){
    return res.status(404).json({error:{code:'NOT_FOUND', message:'portfolio not found'}});
  }
  const allocations = readJson(allocationsFile, {});
  const pairs = readJson(pairsFile, {});
  res.json({...portfolio, allocations: allocations[id]||[], pairs: pairs[id]||[]});
});

// Update portfolio
router.put('/:id', (req,res)=>{
  const {id} = req.params;
  const portfolios = readJson(portfoliosFile, []);
  const idx = portfolios.findIndex(p=>p.id===id);
  if(idx===-1){
    return res.status(404).json({error:{code:'NOT_FOUND', message:'portfolio not found'}});
  }
  const {name, budget} = req.body;
  if(name){
    if(portfolios.some(p=>p.name===name && p.id!==id)){
      return res.status(400).json({error:{code:'VALIDATION_ERROR', message:'name must be unique'}});
    }
    portfolios[idx].name = name;
  }
  if(budget!==undefined){
    if(!(budget>0)){
      return res.status(400).json({error:{code:'VALIDATION_ERROR', message:'budget must be > 0'}});
    }
    portfolios[idx].budget = budget;
  }
  writeJson(portfoliosFile, portfolios);
  res.json({ok:true});
});

// Delete portfolio
router.delete('/:id', (req,res)=>{
  const {id} = req.params;
  let portfolios = readJson(portfoliosFile, []);
  portfolios = portfolios.filter(p=>p.id!==id);
  writeJson(portfoliosFile, portfolios);
  const allocations = readJson(allocationsFile, {});
  delete allocations[id];
  writeJson(allocationsFile, allocations);
  const pairs = readJson(pairsFile, {});
  delete pairs[id];
  writeJson(pairsFile, pairs);
  res.json({ok:true});
});

// Update allocations
router.put('/:id/allocations', (req,res)=>{
  const {id} = req.params;
  const {allocations} = req.body;
  const sum = allocations.reduce((s,a)=>s+Number(a.percent),0);
  if(Math.abs(sum-100) > 0.01){
    return res.status(400).json({error:{code:'ALLOC_SUM_INVALID', message:'Allocations must sum to 100%', details:{sum}}});
  }
  const data = readJson(allocationsFile, {});
  data[id] = allocations.map(a=>({asset:a.asset.toUpperCase(), percent:Number(a.percent)}));
  writeJson(allocationsFile, data);
  res.json({ok:true});
});

// Update pairs
router.put('/:id/pairs', (req,res)=>{
  const {id} = req.params;
  const {pairs} = req.body;
  const data = readJson(pairsFile, {});
  data[id] = pairs;
  writeJson(pairsFile, data);
  res.json({ok:true});
});

// Balance
router.get('/:id/balance', (req,res)=>{
  const portfolio = readJson(portfoliosFile, []).find(p=>p.id===req.params.id);
  if(!portfolio){
    return res.status(404).json({error:{code:'NOT_FOUND', message:'portfolio not found'}});
  }
  // Deterministic mock
  const items = [
    {asset: portfolio.baseCurrency, free:500, used:0, total:500, valuation:500},
    {asset:'BTC', free:0.02, used:0, total:0.02, valuation:600},
    {asset:'ETH', free:0.2, used:0, total:0.2, valuation:200}
  ];
  const totalValuation = items.reduce((s,i)=>s+i.valuation,0);
  res.json({currency:portfolio.baseCurrency, items, totalValuation});
});

module.exports = router;