import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import axios from 'axios';

const AllocationEditor = ({value, onChange}) => {
  const addRow = () => onChange([...value, {asset:'', percent:0}]);
  const update = (idx, field, val) => {
    const next = value.map((a,i)=> i===idx ? {...a, [field]:val} : a);
    onChange(next);
  };
  const remove = idx => onChange(value.filter((_,i)=>i!==idx));
  const total = value.reduce((s,a)=>s+Number(a.percent||0),0);
  return (
    <div>
      <Button label="+ Asset" onClick={addRow} className="mb-2" />
      <DataTable value={value} dataKey="asset" responsiveLayout="scroll">
        <Column field="asset" header="Asset" body={(row,opts)=>(
          <InputText value={row.asset} onChange={e=>update(opts.rowIndex,'asset',e.target.value)} />
        )} />
        <Column field="percent" header="%" body={(row,opts)=>(
          <InputNumber value={row.percent} onChange={e=>update(opts.rowIndex,'percent',e.value)} mode="decimal" minFractionDigits={1} maxFractionDigits={2} />
        )} />
        <Column body={(_,opts)=>(
          <Button icon="pi pi-times" text severity="danger" onClick={()=>remove(opts.rowIndex)} />
        )} />
      </DataTable>
      <p>Total: {total.toFixed(2)}% {Math.abs(total-100)<=0.01 ? '(OK)' : '(KO)'}</p>
    </div>
  );
};

const PairEditor = ({value, onChange, exchange}) => {
  const [query,setQuery]=useState('');
  const [results,setResults]=useState([]);
  useEffect(()=>{
    const t=setTimeout(()=>{
      axios.get('/api/markets',{params:{exchange,query}}).then(res=>setResults(res.data.items));
    },300);
    return ()=>clearTimeout(t);
  },[query,exchange]);
  const addPair = sym => {
    if(value.some(p=>p.symbol===sym)) return;
    onChange([...value,{symbol:sym,enabled:true}]);
    setQuery('');
  };
  const toggle = idx => {
    const next = value.map((p,i)=>i===idx?{...p,enabled:!p.enabled}:p);
    onChange(next);
  };
  const remove = idx => onChange(value.filter((_,i)=>i!==idx));
  return (
    <div>
      <span className="p-input-icon-left w-full mb-2">
        <i className="pi pi-search" />
        <InputText value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher une paire" />
      </span>
      {query && (
        <ul className="mb-2">
          {results.map(r=> (
            <li key={r.symbol}>
              <Button text label={r.symbol} onClick={()=>addPair(r.symbol)} />
            </li>
          ))}
        </ul>
      )}
      <ul>
        {value.map((p,idx)=>(
          <li key={p.symbol} className="mb-1">
            <Button label={p.symbol} onClick={()=>toggle(idx)} className="mr-2" severity={p.enabled?'':'secondary'} />
            <Button icon="pi pi-times" text severity="danger" onClick={()=>remove(idx)} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const PortfolioDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState({name:'', exchangeKeyId:'', baseCurrency:'', budget:0});
  const [allocations,setAllocations]=useState([]);
  const [pairs,setPairs]=useState([]);
  const [balance,setBalance]=useState(null);

  const isNew = id === 'new' || id===undefined;

  useEffect(()=>{
    if(!isNew){
      axios.get(`/api/portfolios/${id}`).then(res=>{
        setPortfolio(res);
        setAllocations(res.allocations||[]);
        setPairs(res.pairs||[]);
      });
      axios.get(`/api/portfolios/${id}/balance`).then(res=>setBalance(res));
    }
  },[id,isNew]);

  const saveInfo = () => {
    if(isNew){
      axios.post('/api/portfolios',portfolio).then(res=>navigate(`/trading/portfolios/${res.data.id}`));
    }else{
      axios.put(`/api/portfolios/${id}`,portfolio).then(()=>navigate('/trading/portfolios'));
    }
  };
  const saveAlloc = () => axios.put(`/api/portfolios/${id}/allocations`,{allocations}).then(()=>{});
  const savePairs = () => axios.put(`/api/portfolios/${id}/pairs`,{pairs}).then(()=>{});

  return (
    <div className="p-4 trading-page-container">
      <Button label="← Retour" className="mb-4" onClick={()=>navigate('/trading/portfolios')} />
      <h1 className="text-2xl font-bold mb-4">{isNew?'Nouveau':'Portefeuille'}</h1>
      <TabView>
        <TabPanel header="Infos">
          <div className="flex flex-column gap-2 max-w-30rem">
            <span className="p-float-label">
              <InputText id="name" value={portfolio.name} onChange={e=>setPortfolio({...portfolio,name:e.target.value})} />
              <label htmlFor="name">Nom</label>
            </span>
            <span className="p-float-label">
              <InputText id="exchangeKeyId" value={portfolio.exchangeKeyId} onChange={e=>setPortfolio({...portfolio,exchangeKeyId:e.target.value})} />
              <label htmlFor="exchangeKeyId">ExchangeKey</label>
            </span>
            <span className="p-float-label">
              <InputText id="baseCurrency" value={portfolio.baseCurrency} onChange={e=>setPortfolio({...portfolio,baseCurrency:e.target.value})} />
              <label htmlFor="baseCurrency">BaseCurrency</label>
            </span>
            <span className="p-float-label">
              <InputNumber id="budget" value={portfolio.budget} onChange={e=>setPortfolio({...portfolio,budget:e.value})} />
              <label htmlFor="budget">Budget</label>
            </span>
            <Button label="Enregistrer" className="mt-2" onClick={saveInfo} />
          </div>
        </TabPanel>
        {!isNew && (
          <TabPanel header="Allocations">
            <AllocationEditor value={allocations} onChange={setAllocations} />
            <Button label="Enregistrer" className="mt-2" onClick={saveAlloc} />
          </TabPanel>
        )}
        {!isNew && (
          <TabPanel header="Paires">
            <PairEditor value={pairs} onChange={setPairs} exchange={portfolio.exchange} />
            <Button label="Enregistrer" className="mt-2" onClick={savePairs} />
          </TabPanel>
        )}
        {!isNew && balance && (
          <TabPanel header="Solde">
            <DataTable value={balance.items} responsiveLayout="scroll" className="mb-2">
              <Column field="asset" header="Asset" />
              <Column field="free" header="Free" />
              <Column field="used" header="Used" />
              <Column field="total" header="Total" />
              <Column field="valuation" header={`Valuation (${balance.currency})`} />
            </DataTable>
            <p>Total: {balance.totalValuation}</p>
          </TabPanel>
        )}
      </TabView>
    </div>
  );
};

export default PortfolioDetailPage;