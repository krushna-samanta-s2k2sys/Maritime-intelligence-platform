import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { generateHistory } from '../data/vesselTimeline'
import { getAttrValue, LEAF_TEMPORAL_MAP } from '../data/attrValueMap'
import { useTemporalDate } from '../hooks/useTemporalDate'
import BiTemporalTimeline from '../components/vessels/BiTemporalTimeline'
import AttrTreeSidebar from '../components/vessels/AttrTreeSidebar'
import AttrContentPanel from '../components/vessels/AttrContentPanel'
import FieldEditPanel from '../components/vessels/FieldEditPanel'
import FilterBuilder from '../components/vessels/FilterBuilder'
import ColumnPickerModal from '../components/vessels/ColumnPickerModal'
import { usePreferences } from '../contexts/PreferencesContext'
import { ALL_VESSEL_COLUMNS, getCellValue } from '../data/vesselColumns'
import { parseSearch, applySearch, describeFilters } from '../utils/searchParser'
import { applyFilters } from '../data/filterConfig'

const VS = [
  {id:1,  nm:'PACIFIC STAR',    imo:'9412345',mmsi:'240987654',cs:'SVAZ3',fl:'GR',fn:'Greece',         flag:'🇬🇷',ty:'Container Ship',  dwt:'59,100', gt:'52,400', nt:'28,600', yr:2008,loa:'294.0m',lbp:'281.0m',beam:'32.2m',depth:'19.4m',maxDraft:'13.5m',sumDraft:'13.1m',ow:'Aegean Carriers SA',      bo:'K. Papadopoulos',       op:'Aegean Carriers SA',    mg:'Columbia Ship Mgmt',   pi:'Steamship Mutual',    cls:"Lloyd's Register",clsNot:"100A1 Container Ship LMC UMS",          ice:'None',eng:'MAN B&W 9S90MC-C',        mcr:'72,240 kW',spd:'22.0 kn',fuel:'HFO + MDO',  prp:'FP',    teu:'5,022',teu_r:'600', st:'In Service',up:'2024-01-30',yard:'Hyundai HI, Ulsan',          hn:'H2341', builtYard:'KR'},
  {id:2,  nm:'EASTERN PIONEER', imo:'9287631',mmsi:'566234567',cs:'9VEC2',fl:'SG',fn:'Singapore',      flag:'🇸🇬',ty:'Oil Tanker',       dwt:'319,000',gt:'160,200',nt:'102,400',yr:2004,loa:'333.0m',lbp:'320.0m',beam:'58.0m',depth:'29.8m',maxDraft:'21.4m',sumDraft:'20.8m',ow:'Pacific Crude Carriers', bo:'Pacific Crude Carriers',op:'Pacific Crude Carriers',mg:'Pacific Crude Carriers',pi:'Gard P&I',             cls:'DNV GL',          clsNot:'1A1 Tanker for oil ESP',                ice:'None',eng:'MAN B&W 7G80ME-C9',        mcr:'27,160 kW',spd:'14.5 kn',fuel:'HFO',        prp:'FP',    st:'In Service',up:'2024-01-29',yard:'Hyundai HI, Ulsan',          hn:'H2222', builtYard:'KR'},
  {id:3,  nm:'STELLAR WIND',    imo:'9534892',mmsi:'431445566',cs:'7JGS1',fl:'JP',fn:'Japan',          flag:'🇯🇵',ty:'LNG Carrier',      dwt:'81,200', gt:'96,500', nt:'46,200', yr:2011,loa:'290.0m',lbp:'277.0m',beam:'46.0m',depth:'25.2m',maxDraft:'12.2m',sumDraft:'11.5m',ow:'Tokyo Gas Shipping',     bo:'Tokyo Gas Corp',        op:'Mitsui OSK Lines',      mg:'Mitsui OSK Lines',     pi:'Japan P&I Club',      cls:'ClassNK',         clsNot:'NS* LNG Carrier',                       ice:'None',eng:'Wärtsilä 12V50DF',         mcr:'22,860 kW',spd:'19.5 kn',fuel:'LNG + HFO',  prp:'CP',    st:'In Service',up:'2024-01-30',yard:'Mitsubishi HI, Nagasaki',    hn:'M2188', builtYard:'JP'},
  {id:4,  nm:'GULF VOYAGER',    imo:'9412340',mmsi:'403123456',cs:'HZGV1',fl:'SA',fn:'Saudi Arabia',   flag:'🇸🇦',ty:'Container Ship',  dwt:'58,200', gt:'52,400', nt:'28,200', yr:2008,loa:'294.0m',lbp:'281.0m',beam:'32.2m',depth:'19.4m',maxDraft:'13.4m',sumDraft:'13.0m',ow:'Saudi Shipping Co.',     bo:'Saudi Aramco',          op:'Gulf Lines LLC',        mg:'Gulf Lines LLC',       pi:'North of England P&I',cls:'DNV GL',          clsNot:'1A1 Container Ship',                    ice:'None',eng:'MAN B&W 9S90MC-C',        mcr:'68,520 kW',spd:'21.5 kn',fuel:'HFO + MDO',  prp:'FP',    teu:'4,890',teu_r:'500', st:'In Service',up:'2024-01-28',yard:'Hyundai HI, Ulsan',          hn:'H2342', builtYard:'KR'},
  {id:5,  nm:'OCEAN PRIDE',     imo:'9341122',mmsi:'352001234',cs:'3EMR9',fl:'PA',fn:'Panama',         flag:'🇵🇦',ty:'Bulk Carrier',     dwt:'82,500', gt:'43,100', nt:'26,800', yr:2006,loa:'229.0m',lbp:'221.0m',beam:'36.5m',depth:'19.6m',maxDraft:'14.8m',sumDraft:'14.4m',ow:'Ocean Bulk Ltd',         bo:'Ocean Bulk Ltd',        op:'Ocean Bulk Ltd',        mg:'V.Ships',              pi:'UK P&I Club',         cls:'Bureau Veritas',  clsNot:'I Hull Mach Bulk Carrier',              ice:'None',eng:'MAN B&W 6S60MC-C',        mcr:'13,560 kW',spd:'14.2 kn',fuel:'HFO',        prp:'FP',    holds:'7',hatches:'7',st:'Detained',   up:'2024-01-30',yard:'Imabari SB, Japan',           hn:'I1882', builtYard:'JP'},
  {id:6,  nm:'PACIFIC ATLAS',   imo:'9601234',mmsi:'477881234',cs:'VRPA1',fl:'HK',fn:'Hong Kong',      flag:'🇭🇰',ty:'Bulk Carrier',     dwt:'82,000', gt:'43,200', nt:'26,900', yr:2015,loa:'229.0m',lbp:'221.0m',beam:'36.5m',depth:'19.6m',maxDraft:'14.8m',sumDraft:'14.3m',ow:'Pacific Bulk Carriers',  bo:'Pacific Bulk Carriers', op:'Pacific Bulk Carriers', mg:'Pacific Bulk Carriers',pi:'Gard P&I',             cls:'DNV GL',          clsNot:'1A1 Bulk Carrier',                      ice:'None',eng:'MAN B&W 6S60ME-C8',        mcr:'13,560 kW',spd:'14.5 kn',fuel:'HFO + MDO',  prp:'FP',    holds:'7',hatches:'7',st:'In Service', up:'2024-01-27',yard:'Imabari SB, Japan',           hn:'I2441', builtYard:'JP'},
  {id:7,  nm:'NORTHERN STAR',   imo:'9188741',mmsi:'257891234',cs:'LNNS1',fl:'NO',fn:'Norway',         flag:'🇳🇴',ty:'Chemical Tanker',  dwt:'38,200', gt:'24,800', nt:'14,200', yr:2002,loa:'183.0m',lbp:'175.0m',beam:'32.2m',depth:'17.5m',maxDraft:'11.2m',sumDraft:'10.8m',ow:'Nordic Chemicals AS',    bo:'Nordic Chemicals AS',   op:'Nordic Chemicals AS',   mg:'Nordic Chemicals AS',  pi:'Gard P&I',             cls:'DNV GL',          clsNot:'1A1 Chemical Tanker',                   ice:'1C', eng:'MAN B&W 6S46MC-C',        mcr:'8,900 kW', spd:'15.0 kn',fuel:'HFO + MDO',  prp:'FP',    st:'In Service',up:'2024-01-26',yard:'Hyundai Mipo, Ulsan',         hn:'HM1441',builtYard:'KR'},
  {id:8,  nm:'MAERSK COLON',    imo:'9778532',mmsi:'219001231',cs:'OZMC1',fl:'DK',fn:'Denmark',        flag:'🇩🇰',ty:'Container Ship',  dwt:'214,000',gt:'214,000',nt:'114,800',yr:2017,loa:'399.0m',lbp:'385.0m',beam:'58.6m',depth:'30.5m',maxDraft:'16.5m',sumDraft:'16.0m',ow:'A.P. Moller-Maersk',     bo:'A.P. Moller Holding',   op:'Maersk Line',           mg:'Maersk Line',          pi:'UK P&I Club',         cls:"Lloyd's Register",clsNot:"100A1 Container Ship ESP LMC UMS",      ice:'None',eng:'MAN B&W 11G95ME-C9',       mcr:'84,700 kW',spd:'23.0 kn',fuel:'HFO + VLSFO',prp:'FP',    teu:'20,568',teu_r:'1,000',st:'In Service',up:'2024-01-30',yard:'Daewoo DSME, Okpo',           hn:'D2882', builtYard:'KR'},
  {id:9,  nm:'ATLANTIC BULKER', imo:'9501238',mmsi:'311041122',cs:'C6AB1',fl:'BS',fn:'Bahamas',        flag:'🇧🇸',ty:'Bulk Carrier',     dwt:'176,400',gt:'90,600', nt:'55,800', yr:2012,loa:'291.0m',lbp:'283.0m',beam:'45.0m',depth:'24.3m',maxDraft:'18.2m',sumDraft:'17.8m',ow:'Star Bulk Carriers',     bo:'Oaktree Capital',       op:'Star Bulk Carriers',    mg:'Star Bulk Carriers',   pi:'North of England P&I',cls:'Bureau Veritas',  clsNot:'I Hull Mach Bulk Carrier ESP',          ice:'None',eng:'MAN B&W 6S70ME-C8',        mcr:'18,660 kW',spd:'14.5 kn',fuel:'HFO',        prp:'FP',    holds:'9',hatches:'9',st:'In Drydock',up:'2024-01-22',yard:'Imabari SB, Japan',           hn:'I1882', builtYard:'JP'},
  {id:10, nm:'MSC OSCAR',       imo:'9703291',mmsi:'255803000',cs:'CSMO1',fl:'PT',fn:'Portugal',       flag:'🇵🇹',ty:'Container Ship',  dwt:'197,362',gt:'153,092',nt:'96,400', yr:2015,loa:'395.4m',lbp:'381.0m',beam:'58.6m',depth:'30.5m',maxDraft:'16.0m',sumDraft:'15.6m',ow:'MSC Mediterranean',      bo:'Gianluigi Aponte Family',op:'MSC Mediterranean',    mg:'MSC Mediterranean',    pi:'Steamship Mutual',    cls:'Bureau Veritas',  clsNot:'I Hull Mach Container Ship',            ice:'None',eng:'MAN B&W 11G95ME-C9',       mcr:'84,700 kW',spd:'22.8 kn',fuel:'HFO + VLSFO',prp:'FP',    teu:'19,224',teu_r:'800', st:'In Service',up:'2024-01-30',yard:'Daewoo DSME, Okpo',           hn:'D3012', builtYard:'KR'},
  {id:11, nm:'QUEEN MARY 2',    imo:'9241061',mmsi:'310627000',cs:'GBQM2',fl:'GB',fn:'United Kingdom', flag:'🇬🇧',ty:'Passenger/Cruise', dwt:'15,809', gt:'148,528',nt:'55,500', yr:2004,loa:'345.0m',lbp:'312.0m',beam:'41.0m',depth:'25.0m',maxDraft:'10.3m',sumDraft:'10.0m',ow:'Cunard Line',            bo:'Carnival Corporation',  op:'Cunard Line',           mg:'Carnival Corporation', pi:'UK P&I Club',         cls:"Lloyd's Register",clsNot:"100A1 Passenger Ship +LMC UMS",        ice:'None',eng:'Rolls-Royce Mermaid pods',mcr:'86,000 kW',spd:'28.5 kn',fuel:'HFO + MDO',  prp:'Podded',pax:'2,695',st:'In Service',up:'2024-01-30',yard:"Chantiers de l'Atlantique",hn:'G32',   builtYard:'FR'},
  {id:12, nm:'PIONEER MAX',     imo:'9612988',mmsi:'538006000',cs:'V7PM1',fl:'MH',fn:'Marshall Islands',flag:'🇲🇭',ty:'LPG Carrier',      dwt:'48,200', gt:'30,100', nt:'18,200', yr:2014,loa:'225.0m',lbp:'214.0m',beam:'36.6m',depth:'20.4m',maxDraft:'11.8m',sumDraft:'11.4m',ow:'Navigator Gas',          bo:'Navigator Holdings',    op:'Navigator Holdings',    mg:'Navigator Holdings',   pi:'Gard P&I',             cls:'DNV GL',          clsNot:'1A1 Tanker for Liquefied Gas',          ice:'1A', eng:'MAN B&W 6S50ME-C8',        mcr:'10,080 kW',spd:'17.0 kn',fuel:'HFO + MDO',  prp:'CP',    st:'In Service',up:'2024-01-29',yard:'Hyundai Mipo, Ulsan',         hn:'HM2441',builtYard:'KR'},
  {id:13, nm:'EURONAV NINA',    imo:'9320116',mmsi:'205001122',cs:'OOEN1',fl:'BE',fn:'Belgium',        flag:'🇧🇪',ty:'Oil Tanker',       dwt:'308,491',gt:'160,038',nt:'103,000',yr:2003,loa:'333.0m',lbp:'320.0m',beam:'58.0m',depth:'29.8m',maxDraft:'22.5m',sumDraft:'22.0m',ow:'Euronav NV',             bo:'Saverys Family',        op:'Euronav NV',            mg:'Euronav NV',           pi:'North of England P&I',cls:'Bureau Veritas',  clsNot:'I Hull Mach Tanker for Oil ESP',        ice:'None',eng:'MAN B&W 7G80ME-C9',        mcr:'27,160 kW',spd:'14.5 kn',fuel:'HFO',        prp:'FP',    st:'In Service',up:'2024-01-28',yard:'Hyundai HI, Ulsan',          hn:'H2100', builtYard:'KR'},
  {id:14, nm:'GLOVIS CAPTAIN',  imo:'9680042',mmsi:'440301122',cs:'D7GC1',fl:'KR',fn:'South Korea',    flag:'🇰🇷',ty:'Car Carrier',       dwt:'23,900', gt:'72,388', nt:'21,700', yr:2014,loa:'200.0m',lbp:'190.0m',beam:'36.0m',depth:'31.5m',maxDraft:'8.6m', sumDraft:'8.2m', ow:'Hyundai Glovis',        bo:'Hyundai Motor Group',   op:'Hyundai Glovis',        mg:'Hyundai Glovis',       pi:'Korea P&I Club',      cls:'Korean Register', clsNot:'KR Car Carrier',                        ice:'None',eng:'MAN B&W 6S60MC-C',        mcr:'13,560 kW',spd:'19.5 kn',fuel:'HFO + MDO',  prp:'FP',    ceu:'6,400',st:'In Service', up:'2024-01-27',yard:'Hyundai HI, Ulsan',          hn:'H2812', builtYard:'KR'},
  {id:15, nm:'NORDIC GRACE',    imo:'9388021',mmsi:'257641122',cs:'V7NG1',fl:'MH',fn:'Marshall Islands',flag:'🇲🇭',ty:'Bulk Carrier',     dwt:'82,000', gt:'43,000', nt:'26,500', yr:2008,loa:'229.0m',lbp:'221.0m',beam:'36.5m',depth:'19.6m',maxDraft:'14.8m',sumDraft:'14.3m',ow:'Nordic Bulk Partners',   bo:'Nordic Bulk Partners',  op:'Nordic Management',     mg:'Nordic Management',    pi:'Steamship Mutual',    cls:'DNV GL',          clsNot:'1A1 Bulk Carrier',                      ice:'None',eng:'MAN B&W 6S60MC-C',        mcr:'13,560 kW',spd:'14.0 kn',fuel:'HFO',        prp:'FP',    holds:'7',hatches:'7',st:'Laid Up',    up:'2024-01-15',yard:'Imabari SB, Japan',           hn:'I1981', builtYard:'JP'},
  {id:16, nm:'BRAVE TERN',      imo:'9593513',mmsi:'259511000',cs:'LNBT1',fl:'NO',fn:'Norway',         flag:'🇳🇴',ty:'Offshore Wind',    dwt:'18,000', gt:'20,700', nt:'8,200',  yr:2012,loa:'182.0m',lbp:'168.0m',beam:'42.0m',depth:'16.0m',maxDraft:'6.6m', sumDraft:'6.3m', ow:'Fred. Olsen Windcarrier',bo:'Fred. Olsen & Co',      op:'Fred. Olsen',           mg:'Fred. Olsen',          pi:'Gard P&I',             cls:'DNV GL',          clsNot:'1A1 Self-Elevating Unit DP2',           ice:'None',eng:'Caterpillar 6x3516C DP2',  mcr:'14,400 kW',spd:'12.0 kn',fuel:'MDO',        prp:'Azimuth',st:'In Service',up:'2024-01-27',yard:'Keppel FELS, Singapore',      hn:'KF2441',builtYard:'SG'},
  {id:17, nm:'COSCO UNIVERSE',  imo:'9871234',mmsi:'477111234',cs:'BPCU1',fl:'CN',fn:'China',          flag:'🇨🇳',ty:'Container Ship',  dwt:'197,800',gt:'187,000',nt:'108,400',yr:2020,loa:'400.0m',lbp:'388.0m',beam:'61.5m',depth:'33.5m',maxDraft:'16.5m',sumDraft:'16.0m',ow:'COSCO Shipping',         bo:'COSCO Group / SASAC',   op:'COSCO Shipping Lines',  mg:'COSCO Shipping',       pi:'China P&I Club',      cls:'China Classification',clsNot:'CSA Container Ship',                    ice:'None',eng:'MAN B&W 11G95ME-C10',      mcr:'84,700 kW',spd:'22.0 kn',fuel:'VLSFO + MDO', prp:'FP',    teu:'21,237',teu_r:'1,200',st:'In Service',up:'2024-01-30',yard:'Shanghai Jiangnan, China',    hn:'JN3882',builtYard:'CN'},
  {id:18, nm:'SUNRISE CARRIER', imo:'9412888',mmsi:'351881234',cs:'3ESC1',fl:'PA',fn:'Panama',         flag:'🇵🇦',ty:'Bulk Carrier',     dwt:'76,200', gt:'40,800', nt:'25,200', yr:2007,loa:'225.0m',lbp:'217.0m',beam:'32.3m',depth:'20.0m',maxDraft:'14.2m',sumDraft:'13.8m',ow:'Sunrise Maritime Ltd',   bo:'Sunrise Maritime Ltd',  op:'Sunrise Maritime Ltd',  mg:'V.Ships Greece',       pi:'North of England P&I',cls:'DNV GL',          clsNot:'1A1 Bulk Carrier',                      ice:'None',eng:'MAN B&W 6S60MC-C',        mcr:'13,560 kW',spd:'14.3 kn',fuel:'HFO',        prp:'FP',    holds:'7',hatches:'7',st:'In Service',up:'2024-01-20',yard:'Imabari SB, Japan',           hn:'I1882', builtYard:'JP'},
  {id:19, nm:'NORDERNEY',       imo:'9388042',mmsi:'211222000',cs:'DKND1',fl:'DE',fn:'Germany',        flag:'🇩🇪',ty:'RoRo',             dwt:'16,200', gt:'24,200', nt:'9,800',  yr:2008,loa:'192.0m',lbp:'183.0m',beam:'26.5m',depth:'15.8m',maxDraft:'6.8m', sumDraft:'6.5m', ow:'DFDS A/S',              bo:'DFDS A/S',              op:'DFDS Logistics',        mg:'DFDS A/S',             pi:'Swedish Club',        cls:'DNV GL',          clsNot:'1A1 RoRo Ship',                         ice:'1A', eng:'Wärtsilä 12V46',          mcr:'14,400 kW',spd:'22.0 kn',fuel:'HFO + MDO',  prp:'CP',    st:'In Service',up:'2024-01-28',yard:'Flensburger SB, Germany',    hn:'F1441', builtYard:'DE'},
  {id:20, nm:'BOURBON LIBERTY', imo:'9450993',mmsi:'228082000',cs:'FNBL1',fl:'FR',fn:'France',         flag:'🇫🇷',ty:'Offshore Supply',  dwt:'4,200',  gt:'3,800',  nt:'1,800',  yr:2010,loa:'75.0m', lbp:'67.0m', beam:'18.0m',depth:'7.2m', maxDraft:'5.8m', sumDraft:'5.5m', ow:'Bourbon Offshore',      bo:'Jaccar Holdings',       op:'Bourbon Offshore',      mg:'Bourbon Offshore',     pi:'Steamship Mutual',    cls:'Bureau Veritas',  clsNot:'I Hull Mach OSV DP2',                   ice:'None',eng:'Cummins QSK60 x4',        mcr:'5,440 kW', spd:'14.5 kn',fuel:'MDO',        prp:'Azimuth DP2',st:'In Service',up:'2024-01-26',yard:'Ulstein Verft, Norway',       hn:'UV2441',builtYard:'NO'},
  {id:21, nm:'LNG JAMAL',       imo:'9234567',mmsi:'441001234',cs:'HLKL1',fl:'KR',fn:'South Korea',    flag:'🇰🇷',ty:'LNG Carrier',      dwt:'78,900', gt:'93,200', nt:'44,800', yr:2008,loa:'286.0m',lbp:'274.0m',beam:'46.0m',depth:'25.2m',maxDraft:'12.2m',sumDraft:'11.5m',ow:'Korea LNG Shipping',     bo:'Korea Gas Corp',        op:'Korea LNG Shipping',    mg:'Korea LNG Shipping',   pi:'Korea P&I Club',      cls:'Korean Register', clsNot:'KR LNG Carrier GTT Mark III',           ice:'None',eng:'Wärtsilä 12V50DF x2',      mcr:'24,000 kW',spd:'19.5 kn',fuel:'LNG + HFO',  prp:'FP',    st:'In Service',up:'2024-01-29',yard:'Hyundai HI, Ulsan',          hn:'H2501', builtYard:'KR'},
  {id:22, nm:'DIANA BULKER',    imo:'9501882',mmsi:'538081234',cs:'V7DB1',fl:'MH',fn:'Marshall Islands',flag:'🇲🇭',ty:'Bulk Carrier',     dwt:'82,100', gt:'43,300', nt:'26,600', yr:2013,loa:'229.0m',lbp:'221.0m',beam:'36.5m',depth:'19.6m',maxDraft:'14.8m',sumDraft:'14.3m',ow:'Diana Shipping',         bo:'Simeon Palios',         op:'Diana Shipping',        mg:'Diana Shipping',       pi:'North of England P&I',cls:'DNV GL',          clsNot:'1A1 Bulk Carrier',                      ice:'None',eng:'MAN B&W 6S60ME-C8',        mcr:'13,560 kW',spd:'14.5 kn',fuel:'HFO + MDO',  prp:'FP',    holds:'7',hatches:'7',st:'In Service',up:'2024-01-29',yard:'Imabari SB, Japan',           hn:'I2181', builtYard:'JP'},
  {id:23, nm:'ADRIATIC SPIRIT', imo:'9445677',mmsi:'229001122',cs:'SWAS1',fl:'GR',fn:'Greece',         flag:'🇬🇷',ty:'Car Carrier',       dwt:'21,200', gt:'60,400', nt:'18,100', yr:2009,loa:'199.0m',lbp:'190.0m',beam:'32.5m',depth:'30.0m',maxDraft:'8.6m', sumDraft:'8.2m', ow:'Med Ro-Ro SA',          bo:'Med Ro-Ro SA',          op:'Med Ro-Ro SA',          mg:'Med Ro-Ro SA',         pi:'Steamship Mutual',    cls:'Bureau Veritas',  clsNot:'I Hull Mach Car Carrier',               ice:'None',eng:'MAN B&W 7S60MC-C',        mcr:'15,820 kW',spd:'19.0 kn',fuel:'HFO + MDO',  prp:'FP',    ceu:'6,000',st:'In Service', up:'2024-01-25',yard:'Hyundai HI, Ulsan',          hn:'H2612', builtYard:'KR'},
  {id:24, nm:'BOREALIS',        imo:'9484948',mmsi:'218001122',cs:'DKBR1',fl:'DE',fn:'Germany',        flag:'🇩🇪',ty:'Research Vessel',  dwt:'3,200',  gt:'4,800',  nt:'2,400',  yr:2010,loa:'107.0m',lbp:'98.0m', beam:'20.0m',depth:'8.5m', maxDraft:'6.0m', sumDraft:'5.7m', ow:'GEOMAR Helmholtz',      bo:'German Federal Gov.',   op:'GEOMAR',                mg:'GEOMAR',               pi:'Gard P&I',             cls:'DNV GL',          clsNot:'1A1 Research Vessel DP2',               ice:'1A', eng:'Rolls-Royce Bergen B32:40V12',mcr:'3,840 kW', spd:'15.5 kn',fuel:'MDO',        prp:'Azimuth DP2',st:'In Service',up:'2024-01-22',yard:'Flensburger SB, Germany',    hn:'F1881', builtYard:'DE'},
  {id:25, nm:'PIONEER TRADER',  imo:'9499283',mmsi:'636018000',cs:'A8PT1',fl:'LR',fn:'Liberia',        flag:'🇱🇷',ty:'General Cargo',    dwt:'9,880',  gt:'7,200',  nt:'4,400',  yr:2011,loa:'121.0m',lbp:'113.0m',beam:'19.6m',depth:'10.5m',maxDraft:'7.8m', sumDraft:'7.5m', ow:'Pioneer Shipping',      bo:'Pioneer Shipping',      op:'Pioneer Shipping',      mg:'Pioneer Shipping',     pi:'UK P&I Club',         cls:'Bureau Veritas',  clsNot:'I Hull Mach General Cargo',             ice:'None',eng:'MAN B&W 6L35MC',          mcr:'4,440 kW', spd:'14.5 kn',fuel:'HFO + MDO',  prp:'FP',    holds:'4',hatches:'4',st:'In Service',up:'2024-01-26',yard:'Jiangzhou SB, China',        hn:'JZ1441',builtYard:'CN'},
]

const STCLS = {'In Service':'stA','Detained':'stR','In Drydock':'stD','Laid Up':'stI','Total Loss':'stR'}
const SRC_CLS = {'IHS Fairplay':'sIHS','AIS':'sAIS','DNV GL':'sDNV',"Lloyd's Register":'sLR','Bureau Veritas':'sBV','ClassNK':'sNK','Korean Register':'sKR','China Classification':'sNK','Flag Registry':'sFLAG','IMO GISIS':'sIHS','OCIMF':'sAIS'}
function Src({s}) { const cls=SRC_CLS[s]||'sIHS'; const lbl=s&&s.length>8?s.split(' ').map(w=>w[0]).join('').slice(0,4):s||'?'; return <span className={`src ${cls}`}>{lbl}</span> }

export default function Vessels() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { vesselColumns, attrFavorites, toggleAttrFavorite, persona,
          vesselFilters, updateVesselFilters } = usePreferences()

  // Navigation: ?id=N or ?imo=XXXXXXX → detail view, ?date=YYYY-MM-DD → temporal position
  const detailId  = searchParams.get('id')
  const imoParam  = searchParams.get('imo')
  const dateParam = searchParams.get('date')
  const vessel = imoParam  ? VS.find(v => v.imo === imoParam)          || null
               : detailId ? VS.find(v => String(v.id) === detailId) || null : null

  const [search,        setSearch]        = useState('')
  const [activeFilters, setActiveFilters] = useState(() => vesselFilters)
  const [showColPicker, setShowColPicker] = useState(false)
  const [selectedIds,   setSelectedIds]   = useState(new Set())
  const [activeNode,    setActiveNode]    = useState('general')
  const [selLeafId,     setSelLeafId]     = useState(null)
  const [selLeafLabel,  setSelLeafLabel]  = useState(null)
  const [editMode,      setEditMode]      = useState(false)
  const [showTimeline,  setShowTimeline]  = useState(true)
  const [sortKey,       setSortKey]       = useState('name')
  const [sortDir,       setSortDir]       = useState('asc')
  const [histPanelWidth,     setHistPanelWidth]     = useState(320)
  const [histPanelCollapsed, setHistPanelCollapsed] = useState(false)
  const histWidthRef = useRef(320)

  function startHistResize(e) {
    e.preventDefault()
    const startX = e.clientX
    const startW = histWidthRef.current
    function onMove(ev) {
      const newW = Math.max(240, Math.min(600, startW - (ev.clientX - startX)))
      histWidthRef.current = newW
      setHistPanelWidth(newW)
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.classList.remove('ew-resizing')
    }
    document.body.classList.add('ew-resizing')
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const { curDate, setCurDate, dateToPct, jumpToMilestone, events, TL_START_YR, TL_END_YR } = useTemporalDate(vessel)

  // Sync date from URL param (deep link from AIS / Dashboard)
  useEffect(() => {
    if (dateParam && vessel) setCurDate(dateParam)
  }, [vessel?.id, dateParam]) // eslint-disable-line react-hooks/exhaustive-deps

  // Smart search + filter builder filters combined
  const filtered = useMemo(() => {
    let vl = VS

    if (search.trim()) {
      const parsed = parseSearch(search)
      vl = applySearch(vl, parsed)
    }

    vl = applyFilters(vl, activeFilters)

    vl = [...vl].sort((a, b) => {
      let av = a.nm, bv = b.nm
      if (sortKey === 'imo')   { av = a.imo;  bv = b.imo  }
      if (sortKey === 'built') { av = a.yr;   bv = b.yr   }
      if (sortKey === 'dwt')   { av = Number(a.dwt.replace(/,/g,'')); bv = Number(b.dwt.replace(/,/g,'')) }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
    return vl
  }, [search, activeFilters, sortKey, sortDir])

  // Search interpretation hints
  const searchHints = useMemo(() => {
    if (!search.trim()) return []
    const parsed = parseSearch(search)
    return describeFilters(parsed)
  }, [search])

  // Columns to show
  const visibleColumns = useMemo(() =>
    ALL_VESSEL_COLUMNS.filter(c => c.always || vesselColumns.includes(c.id)),
  [vesselColumns])

  function openDetail(id) {
    setActiveNode('general'); setSelLeafId(null); setSelLeafLabel(null)
    setEditMode(false); setShowTimeline(false)
    setSearchParams({ id: String(id) })
  }

  function closeDetail() {
    setSearchParams({})
  }

  if (vessel) {
    // Resolve exact entity key + label for mapped leaves; fall back to tree label for others
    const leafMeta     = selLeafId ? LEAF_TEMPORAL_MAP[selLeafId] : null
    const histLabel    = leafMeta ? leafMeta.label    : selLeafLabel
    const histEntity   = leafMeta ? leafMeta.entity   : null
    const histFallback = selLeafId ? getAttrValue(vessel, selLeafId) : null
    const histRows = selLeafLabel
      ? generateHistory(histLabel, vessel, histEntity, histFallback)
      : []
    const histOpen = selLeafId !== null

    return (
      <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>

        {/* ── Compact vessel bar ── */}
        <div className="dHead">
          <button className="backBtn" onClick={closeDetail}>← Fleet</button>
          <div className="dHeadDiv"/>
          <span className="vdHeadFlag">{vessel.flag}</span>
          <span className="vNm">{vessel.nm}</span>
          <span className="vdHdrMono">IMO {vessel.imo}</span>
          <span className="tag tN" style={{fontSize:9,flexShrink:0}}>{vessel.ty}</span>
          <span className={`stBadge ${STCLS[vessel.st]||'stI'}`} style={{flexShrink:0}}><span className="stDot"/>{vessel.st}</span>
          <div className="dHeadDiv"/>
          <span className="vdHdrKpi">DWT<strong>{vessel.dwt}</strong></span>
          <span className="vdHdrKpi">GT<strong>{vessel.gt}</strong></span>
          <span className="vdHdrKpi">LOA<strong>{vessel.loa}</strong></span>
          <span className="vdHdrKpi">Built<strong>{vessel.yr}</strong></span>
          <div className="dActs">
            <button
              className={`btn btnSm${showTimeline ? ' btnP' : ' btnT'}`}
              onClick={() => setShowTimeline(t => !t)}
              title="Toggle bi-temporal timeline"
            >⏱ Timeline</button>
            <button className="btn btnT btnSm" onClick={() => setEditMode(e=>!e)}>
              {editMode ? '✕ Cancel' : '✎ Edit'}
            </button>
            <button className="btn btnT btnSm">↗ Export</button>
            <button className="btn btnT btnSm" onClick={() => navigate('/movements')}>🗺 Track</button>
            <button className="btn btnT btnSm" onClick={() => navigate('/psc')}>🔍 PSC</button>
          </div>
        </div>

        {editMode && <div className="eBan">⚠ Edit mode — all changes versioned in bi-temporal audit log (valid_from / valid_to / transaction_time)</div>}

        {/* ── Collapsible bi-temporal timeline ── */}
        {showTimeline && (
          <BiTemporalTimeline
            vessel={vessel} curDate={curDate} onDateChange={setCurDate}
            dateToPct={dateToPct} jumpToMilestone={jumpToMilestone}
            events={events} TL_START_YR={TL_START_YR} TL_END_YR={TL_END_YR}
          />
        )}

        {/* ── 3-panel body: tree | attributes | history ── */}
        <div className={`vdBody${histOpen ? ' histOpen' : ''}`}>

          {/* Left: full attribute tree */}
          <AttrTreeSidebar
            key={vessel.id}
            vessel={vessel}
            curDate={curDate}
            activeNode={activeNode}
            favorites={attrFavorites}
            onToggleFavorite={toggleAttrFavorite}
            personaAttrSections={persona.attrSections}
            onSelectNode={id => { setActiveNode(id); setSelLeafId(null); setSelLeafLabel(null) }}
          />

          {/* Centre: all attributes for selected node */}
          <AttrContentPanel
            vessel={vessel}
            activeNode={activeNode}
            editMode={editMode}
            selLeafId={selLeafId}
            curDate={curDate}
            onSelectLeaf={(id, label) => { setSelLeafId(id); setSelLeafLabel(label); setHistPanelCollapsed(false) }}
          />

          {/* Right: field edit + history panel */}
          <div
            className={`vdHistPanel${histOpen ? ' histOpen' : ''}${histOpen && histPanelCollapsed ? ' histCollapsed' : ''}`}
            style={histOpen && !histPanelCollapsed ? { flex: `0 0 ${histPanelWidth}px`, width: histPanelWidth } : undefined}
          >
            {histOpen && (
              <>
                <div className="vdHistResizeHandle" onMouseDown={startHistResize} title="Drag to resize" />
                <div className="vdHistHeader">
                  <button
                    className="vdHistCollapseBtn"
                    onClick={() => setHistPanelCollapsed(c => !c)}
                    title={histPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
                  >{histPanelCollapsed ? '‹' : '›'}</button>
                  {!histPanelCollapsed && <span className="vdHistHeaderTitle">Field History</span>}
                </div>
              </>
            )}
            {!histPanelCollapsed && (
              <FieldEditPanel
                vessel={vessel}
                leaf={selLeafId ? { id: selLeafId, label: selLeafLabel } : null}
                editMode={editMode}
                curDate={curDate}
                histRows={histRows}
                onClose={() => { setSelLeafId(null); setSelLeafLabel(null) }}
                onJumpDate={setCurDate}
              />
            )}
          </div>
        </div>

        {editMode && (
          <div className="eActBar">
            <button className="btn btnS" onClick={() => setEditMode(false)}>Cancel</button>
            <button className="btn btnP" onClick={() => setEditMode(false)}>💾 Save Changes</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>
      {/* Search + toolbar */}
      <div className="sBar">
        <div className="siWrap" style={{flex:1,minWidth:260}}>
          <span className="siIc">🔍</span>
          <input
            className="si"
            placeholder='Search: name, IMO, flag, owner… or try "vlcc detained", "built>2015 container", "flag:panama"'
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="siClear" onClick={() => setSearch('')} title="Clear search">✕</button>}
        </div>
        <button className="btn btnS btnSm" onClick={() => setSearch(search.trim())}>Search</button>
        <select className="fSel" value={sortKey} onChange={e => setSortKey(e.target.value)}>
          <option value="name">Sort: Name A→Z</option>
          <option value="imo">Sort: IMO ↑</option>
          <option value="built">Sort: Built Year</option>
          <option value="dwt">Sort: DWT</option>
        </select>
        <button className="btn btnP btnSm">+ Add Vessel</button>
      </div>

      {/* Search interpretation hints */}
      {searchHints.length > 0 && (
        <div className="searchHints">
          <span className="searchHintsLabel">Searching by:</span>
          {searchHints.map((h, i) => <span key={i} className="tag tB" style={{fontSize:9}}>{h}</span>)}
        </div>
      )}

      {/* Filter builder bar + column picker */}
      <div className="fbBarWrap">
        <FilterBuilder
          filters={activeFilters}
          onChange={f => { setActiveFilters(f); updateVesselFilters(f) }}
          vessels={VS}
        />
        <button className="btn btnS btnSm fbColsBtn" onClick={() => setShowColPicker(true)} title="Customise columns">⊞ Columns</button>
      </div>

      {/* Results bar */}
      <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>
        <div className="rBar">
          <div>Showing <strong>{filtered.length}</strong> of <strong>847,392</strong> vessels</div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {selectedIds.size > 0 && (
              <>
                <span style={{fontSize:11,color:'var(--txt2)'}}><strong>{selectedIds.size}</strong> selected</span>
                <button className="btn btnSm" style={{background:'var(--red)',color:'#fff',border:'none',padding:'3px 10px'}}
                  onClick={() => setSelectedIds(new Set())}>
                  🗑 Delete ({selectedIds.size})
                </button>
                <button className="btn btnS btnSm" onClick={() => setSelectedIds(new Set())}>Deselect All</button>
              </>
            )}
            <div style={{fontSize:10,color:'var(--txt3)'}}>{visibleColumns.length} columns · {vesselColumns.length} configured</div>
          </div>
        </div>

        {/* Table */}
        <div className="tWrap">
          <table className="vt">
            <thead>
              <tr>
                <th style={{width:26}}>
                  <input type="checkbox"
                    checked={filtered.length > 0 && filtered.every(v => selectedIds.has(v.id))}
                    ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && !filtered.every(v => selectedIds.has(v.id)) }}
                    onChange={() => {
                      const allSel = filtered.every(v => selectedIds.has(v.id))
                      setSelectedIds(allSel ? new Set() : new Set(filtered.map(v => v.id)))
                    }}
                  />
                </th>
                {visibleColumns.map(col => (
                  <th key={col.id} style={{minWidth:col.width,cursor:'pointer',userSelect:'none'}} onClick={() => {
                    if (sortKey===col.id) setSortDir(d=>d==='asc'?'desc':'asc')
                    else { setSortKey(col.id); setSortDir('asc') }
                  }}>
                    {col.label}{sortKey===col.id ? (sortDir==='asc'?' ▲':' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const sc = STCLS[v.st] || 'stI'
                return (
                  <tr key={v.id}>
                    <td><input type="checkbox" checked={selectedIds.has(v.id)}
                      onChange={() => setSelectedIds(prev => { const s=new Set(prev); s.has(v.id)?s.delete(v.id):s.add(v.id); return s })}
                      onClick={e => e.stopPropagation()}
                    /></td>
                    {visibleColumns.map(col => {
                      const val = getCellValue(col.id, v)
                      if (col.id === 'name') return (
                        <td key={col.id} style={{whiteSpace:'nowrap'}}>
                          <span className="vtFlagBadge">{v.fl}</span>
                          <button className="vLnk" onClick={() => openDetail(v.id)}>{v.nm}</button>
                        </td>
                      )
                      if (col.id === 'imo') return (
                        <td key={col.id}>
                          <div className="mn" style={{fontSize:11}}>{v.imo}</div>
                          <div className="mn" style={{fontSize:9,color:'var(--txt3)'}}>{v.mmsi}</div>
                        </td>
                      )
                      if (col.id === 'type') return <td key={col.id}><span className="tag tN" style={{fontSize:9}}>{v.ty}</span></td>
                      if (col.id === 'status') return <td key={col.id}><span className={`stBadge ${sc}`}><span className="stDot"/>{v.st}</span></td>
                      if (col.id === 'class') return <td key={col.id}><span className="tag tN" style={{fontSize:9}}>{v.cls}</span></td>
                      if (['dwt','gt','nt','mcr'].includes(col.id)) return <td key={col.id} className="mn" style={{fontSize:11}}>{val}</td>
                      return (
                        <td key={col.id} style={{fontSize:11,maxWidth:col.width,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {typeof val === 'string' ? val : '—'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pgBar">
          {[1,2,3,'…',847].map((p,i) => typeof p==='number'
            ? <button key={i} className={`pgBtn${p===1?' on':''}`}>{p}</button>
            : <span key={i} style={{color:'var(--txt3)',fontSize:11,padding:'0 4px'}}>{p}</span>
          )}
          <span style={{fontSize:11,color:'var(--txt3)',marginLeft:'auto'}}>Page 1 of 33,895 · 25 per page</span>
        </div>
      </div>

      {/* Column picker modal */}
      {showColPicker && <ColumnPickerModal onClose={() => setShowColPicker(false)} />}
    </div>
  )
}
