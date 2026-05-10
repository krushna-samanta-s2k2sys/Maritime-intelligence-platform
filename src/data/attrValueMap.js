// Maps attributeTree leaf node IDs to vessel data fields
// Returns '' for attributes not present in the demo dataset

const MAP = {
  // === GENERAL → Identity ===
  'af-name':         v => v.nm,
  'af-imo':          v => v.imo,
  'af-mmsi':         v => v.mmsi,
  'af-callsign':     v => v.cs,
  'af-flag':         v => `${v.fl} – ${v.fn}`,
  'af-lrno':         () => '—',
  'af-eni':          () => '—',
  'af-offno':        () => '—',
  'af-por':          () => '—',
  'af-porcode':      () => '—',

  // === GENERAL → Status ===
  'af-status':       v => v.st,
  'af-ssc':          () => 'ISM',
  'af-ss-effdate':   v => v.up || '—',

  // === GENERAL → Ship Type ===
  'af-type':         v => v.ty,
  'af-stl2':         () => '—',
  'af-stl3':         () => '—',
  'af-stl4':         () => '—',
  'af-stl5':         () => '—',
  'af-statc5':       () => '—',

  // === GENERAL → Dimensions ===
  'af-loa':          v => v.loa,
  'af-lbp':          v => v.lbp,
  'af-lengreg':      () => '—',
  'af-beam':         v => v.beam,
  'af-breadthm':     v => v.beam,
  'af-depth':        v => v.depth,
  'af-maxdraft':     v => v.maxDraft,
  'af-draught':      v => v.sumDraft,
  'af-displacement': () => '—',
  'af-freeboard':    () => '—',
  'af-kmheight':     () => '—',
  'af-tpci':         () => '—',

  // === GENERAL → Tonnage ===
  'af-dwt':          v => v.dwt,
  'af-gt':           v => v.gt,
  'af-nt':           v => v.nt,
  'af-pcnt':         () => '—',
  'af-scnt':         () => '—',
  'af-cgt':          () => '—',
  'af-ldt':          () => '—',

  // === GENERAL → Key Dates ===
  'af-builtyear':    v => String(v.yr),
  'af-delivery':     v => String(v.yr),
  'af-keellaid':     () => '—',
  'af-launch':       () => '—',
  'af-contract':     () => '—',
  'af-convdate':     () => '—',
  'af-deathdate':    () => '—',
  'af-newbuild':     v => v.yr >= 1990 ? 'Yes' : '—',

  // === GENERAL → Builder ===
  'af-builtcountry': v => v.builtYard,
  'af-shipbuilder':  v => v.yard,
  'af-yardno':       v => v.hn,
  'af-leadseries':   () => '—',
  'af-sistership':   () => '—',

  // === GENERAL → Ice Class ===
  'af-iceclass':     v => v.ice !== 'None' ? v.ice : '—',
  'af-iceclasscode': () => '—',
  'af-icebreak':     () => '—',
  'af-icestrong':    v => v.ice !== 'None' ? 'Yes' : '—',
  'af-fs1a':         () => '—',
  'af-fs1b':         () => '—',
  'af-fs1c':         () => '—',
  'af-fs1asuper':    () => '—',
  'af-fs2':          () => '—',
  'af-polarpc1':     () => '—',
  'af-polarpc2':     () => '—',
  'af-polarpc3':     () => '—',
  'af-polarpc4':     () => '—',
  'af-polarpc5':     () => '—',
  'af-polarpc6':     () => '—',
  'af-polarpc7':     () => '—',
  'af-icewww':       () => '—',
  'af-icenarr':      () => '—',

  // === GENERAL → Crew ===
  'af-crewdate':     v => v.up || '—',
  'af-totcrew':      () => '—',
  'af-officers':     () => '—',
  'af-ratings':      () => '—',
  'af-cadets':       () => '—',

  // === CONSTRUCTION → Hull ===
  'af-hullmat':      () => 'Steel',
  'af-hulltype':     () => 'Double Hull',
  'af-bulbow':       v => v.ty !== 'Car Carrier' ? 'Yes' : '—',
  'af-decks':        () => '—',
  'af-bowvisor':     () => '—',

  // === CONSTRUCTION → Manifolds & Mooring ===
  'af-manifball':    () => '—',
  'af-manifladen':   () => '—',
  'af-linesperside': () => '—',

  // === MACHINERY → Engine ===
  'af-mcr':          v => v.mcr,
  'af-prp':          v => v.prp,
  'af-engmodel':     v => v.eng,
  'af-engtype':      v => v.eng && v.eng.includes('Wärtsilä') ? 'Dual-Fuel' : '2-stroke diesel',
  'af-engbuild':     v => v.eng ? v.eng.split(' ')[0] : '—',
  'af-engdesign':    v => v.eng ? v.eng.split(' ')[0] : '—',
  'af-cylno':        () => '—',
  'af-bore':         () => '—',
  'af-stroke':       () => '—',
  'af-stroketype':   () => '—',
  'af-rpm':          () => '—',
  'af-bhp':          () => '—',
  'af-pwrkwmax':     v => v.mcr || '—',
  'af-pwrkwsvc':     () => '—',
  'af-pwrbhpmax':    () => '—',
  'af-pwrbhpsvc':    () => '—',
  'af-noengines':    () => '1',
  'af-noaux':        () => '—',
  'af-nomotors':     () => '—',
  'af-nopropunits':  () => '1',
  'af-noalleng':     () => '—',
  'af-totkwmain':    v => v.mcr || '—',
  'af-totpowall':    () => '—',
  'af-totpowaux':    () => '—',
  'af-totpowmot':    () => '—',
  'af-boilermfr':    () => '—',
  'af-tier3':        () => '—',
  'af-tier3hpegr':   () => '—',
  'af-tier3kecos':   () => '—',
  'af-tier3icer':    () => '—',
  'af-tier3ecoegr':  () => '—',
  'af-tier3iscr':    () => '—',
  'af-tier3hpscr':   () => '—',
  'af-tier3lpscr':   () => '—',
  'af-tier3egrtc':   () => '—',
  'af-tier3egrbp':   () => '—',

  // === MACHINERY → Fuel ===
  'af-fuel':         v => v.fuel,
  'af-fuelcap':      () => '—',
  'af-fuel2cap':     () => '—',
  'af-bunker':       () => '—',
  'af-consume1':     () => '—',
  'af-consume2':     () => '—',
  'af-consumev1':    () => '—',
  'af-consumev2':    () => '—',
  'af-residual':     v => v.fuel && v.fuel.includes('HFO') ? 'Yes' : 'No',
  'af-distillate':   v => v.fuel && (v.fuel.includes('MDO') || v.fuel.includes('VLSFO')) ? 'Yes' : 'No',
  'af-lng':          v => v.fuel && v.fuel.includes('LNG') ? 'Yes' : 'No',
  'af-lpg':          v => v.fuel && v.fuel.includes('LPG') ? 'Yes' : 'No',
  'af-methanol':     () => 'No',
  'af-ammonia':      () => 'No',
  'af-hydrogen':     () => 'No',
  'af-biofuel':      () => 'No',
  'af-gasfuel':      v => v.fuel && v.fuel.includes('LNG') ? 'Yes' : 'No',
  'af-batpow':       () => 'No',
  'af-ammoniaready': () => 'No',
  'af-hydrogenready':() => 'No',
  'af-methanolready':() => 'No',
  'af-gasready':     () => 'No',
  'af-coal':         () => 'No',
  'af-gasboiloff':   () => 'No',
  'af-ethane':       () => 'No',
  'af-lvoc':         () => '—',
  'af-nuclear':      () => 'No',

  // === MACHINERY → Speed ===
  'af-speedmax':     v => v.spd,
  'af-speedsvc':     () => '—',

  // === MACHINERY → Propeller ===
  'af-proptype':     v => v.prp,
  'af-proppos':      () => 'Centre',
  'af-proptcode':    v => v.prp === 'FP' ? 'FP' : v.prp === 'CP' ? 'CP' : '—',
  'af-screw':        () => '1',
  'af-propman':      () => '—',
  'af-rpmmax':       () => '—',
  'af-rpmsvc':       () => '—',
  'af-nozzle':       () => '—',
  'af-auxprp':       () => '—',

  // === MACHINERY → Thrusters & DP ===
  'af-thrtype':      () => '—',
  'af-thrtcode':     () => '—',
  'af-thrno':        () => '—',
  'af-thrpos':       () => '—',
  'af-thrkw':        () => '—',
  'af-thrbhp':       () => '—',
  'af-dp0':          () => '—',
  'af-dp1':          () => '—',
  'af-dp2':          v => v.clsNot && v.clsNot.includes('DP2') ? 'Yes' : '—',
  'af-dp3':          () => '—',
  'af-thrnarr':      () => '—',

  // === MACHINERY → Generators ===
  'af-genno':        () => '—',
  'af-genkw':        () => '—',
  'af-genvolt':      () => '—',
  'af-genvolt2':     () => '—',
  'af-genfreq':      () => '—',
  'af-genacdc':      () => 'AC',
  'af-genpos':       () => '—',
  'af-genhpaux':     () => '—',
  'af-genhpmain':    () => '—',
  'af-auxnarr':      () => '—',

  // === MACHINERY → Gear & Cranes ===
  'af-geartype':     () => '—',
  'af-gearno':       () => '—',
  'af-gearswl':      () => '—',
  'af-gearnolar':    () => '—',
  'af-gearswllar':   () => '—',
  'af-geartyplar':   () => '—',
  'af-gearless':     () => '—',
  'af-craneswl':     () => '—',
  'af-derrickswl':   () => '—',
  'af-gearnarr':     () => '—',

  // === MACHINERY → Emissions & Green Tech ===
  'af-scrubfitted':  v => v.fuel && v.fuel.includes('VLSFO') ? 'No' : '—',
  'af-scrubtype':    () => '—',
  'af-scrubdesign':  () => '—',
  'af-scrubretr':    () => '—',
  'af-scrubrety':    () => '—',
  'af-scrubready':   () => 'No',
  'af-eedi':         () => '—',
  'af-eedi1':        () => '—',
  'af-eedi2':        () => '—',
  'af-eedi3':        () => '—',
  'af-windass':      () => 'No',
  'af-solar':        () => 'No',
  'af-battery':      () => 'No',
  'af-shorepower':   () => '—',
  'af-shorepwrready':() => '—',
  'af-ccs':          () => 'No',
  'af-ccsready':     () => 'No',
  'af-autonomous':   () => 'No',
  'af-cybersafe':    () => '—',
  'af-ihmpw':        () => '—',
  'af-greenawrd':    () => '—',
  'af-qualship21':   () => '—',
  'af-qualshipez':   () => '—',

  // === MACHINERY → Battery System ===
  'af-batmfr':       () => '—',
  'af-batkwh':       () => '—',
  'af-batvolmax':    () => '—',
  'af-batvolmin':    () => '—',
  'af-battech':      () => '—',
  'af-batprptype':   () => '—',
  'af-batretr':      () => '—',
  'af-batrety':      () => '—',
  'af-batinteg':     () => '—',

  // === OWNERSHIP → Registered Owner ===
  'af-owner':        v => v.ow,
  'af-benowner':     v => v.bo,
  'af-ownercode':    () => '—',
  'af-owncod':       () => '—',
  'af-owncodcode':   () => '—',
  'af-ownctrl':      () => '—',
  'af-ownreg':       () => '—',

  // === OWNERSHIP → Technical Manager ===
  'af-manager':      v => v.mg,
  'af-mgcode':       () => '—',
  'af-mgrcod':       () => '—',
  'af-mgrcodcode':   () => '—',
  'af-mgrctrl':      () => '—',
  'af-mgrreg':       () => '—',

  // === OWNERSHIP → Ship Manager / Operator ===
  'af-operator':     v => v.op,
  'af-opcode':       () => '—',
  'af-opmancod':     () => '—',
  'af-opmancodc':    () => '—',
  'af-opctrl':       () => '—',
  'af-opreg':        () => '—',

  // === OWNERSHIP → DOC Company ===
  'af-docco':        v => v.mg,
  'af-doccod':       () => '—',
  'af-doccodom':     () => '—',
  'af-doccodomcd':   () => '—',
  'af-docctrl':      () => '—',
  'af-docreg':       () => '—',

  // === OWNERSHIP → Bareboat Charter ===
  'af-bbcharter':    () => '—',
  'af-bbcode':       () => '—',
  'af-bbdom':        () => '—',
  'af-bbdomcode':    () => '—',
  'af-bbctrl':       () => '—',
  'af-bbctrlcode':   () => '—',
  'af-bbreg':        () => '—',
  'af-bbregcode':    () => '—',
  'af-bbeffdate':    () => '—',

  // === OWNERSHIP → Charterer ===
  'af-charterer':    () => '—',

  // === OWNERSHIP → Sale & Purchase ===
  'af-saledate':     () => '—',
  'af-saleprice':    () => '—',
  'af-soldto':       () => '—',
  'af-soldtocode':   () => '—',
  'af-salestext':    () => '—',

  // === CLASSIFICATION → Society ===
  'af-class':        v => v.cls,
  'af-classcode':    () => '—',
  'af-classnot':     v => v.clsNot,
  'af-classind':     () => '—',
  'af-classcode2':   () => '—',
  'af-classeff':     v => v.up || '—',
  'af-classwith':    () => '—',
  'af-classreason':  () => '—',
  'af-dualreg':      () => 'No',
  'af-socissuer':    v => v.cls,
  'af-otherissuer':  () => '—',

  // === CLASSIFICATION → Notation Details ===
  'af-shipright':    () => '—',
  'af-sersnonlr':    () => '—',
  'af-bca':          () => '—',
  'af-bcb':          () => '—',
  'af-bcc':          () => '—',
  'af-csr':          v => v.ty === 'Bulk Carrier' || v.ty === 'Oil Tanker' ? 'Yes' : '—',
  'af-esp':          v => v.clsNot && v.clsNot.includes('ESP') ? 'Yes' : '—',
  'af-iws':          () => '—',
  'af-oiws':         () => '—',
  'af-grab':         () => '—',
  'af-pthts':        () => '—',
  'af-classnarr':    () => '—',

  // === CLASSIFICATION → Surveys ===
  'af-specsurvlast': v => `${v.yr + 10}-06-01`,
  'af-specsurvnext': v => `${v.yr + 15}-06-01`,
  'af-annsurvlast':  v => `2023-09-${10 + (v.id % 18) < 10 ? '0' : ''}${10 + (v.id % 18)}`,
  'af-annsurvnext':  () => '2024-09-30',
  'af-drydocklast':  () => '2021-06-01',
  'af-drydocknext':  () => '—',
  'af-contihull':    () => '—',
  'af-contimach':    () => '—',
  'af-tailshaft':    () => '—',
  'af-specsurveylk': () => '—',
  'af-surveylast':   () => '—',
  'af-surveylastcd': () => '—',
  'af-surveyauth':   v => v.cls,
  'af-surveyauthcd': () => '—',
  'af-surveyauthtyp':() => '—',

  // === SAFETY → DOC ===
  'af-docissuer':    v => v.cls,
  'af-docissued':    () => '—',
  'af-docexpiry':    () => '—',
  'af-doctype':      () => 'ISM DOC',
  'af-doctitlecd':   () => '—',
  'af-docissuacd':   () => '—',

  // === SAFETY → SMC ===
  'af-smcissued':    () => '—',
  'af-smcexp':       () => '—',
  'af-smcflag':      v => v.fn,
  'af-smcissuer':    () => '—',
  'af-smcshiptype':  v => v.ty,
  'af-smcshipname':  v => v.nm,
  'af-smcdocco':     v => v.mg,
  'af-smcauditor':   () => '—',
  'af-smccompliance':() => 'Convention',
  'af-smcotherdesc': () => '—',
  'af-smcsource':    () => '—',

  // === SAFETY → IOPP & Fire ===
  'af-iopp':         v => ['Oil Tanker','Chemical Tanker','LNG Carrier','LPG Carrier'].includes(v.ty) ? 'Yes' : '—',
  'af-ff1':          () => '—',
  'af-ff2':          () => '—',
  'af-ff3':          () => '—',
  'af-ffcap':        v => ['Offshore Supply','Offshore Wind'].includes(v.ty) ? 'Yes' : '—',
  'af-heli':         v => ['Passenger/Cruise','Offshore Wind','Offshore Supply'].includes(v.ty) ? 'Yes' : '—',
  'af-co2':          () => '—',
  'af-enhfire':      v => v.ty === 'Container Ship' ? '—' : '—',
  'af-extrafireafv': () => '—',

  // === SAFETY → PSC ===
  'af-inspdate':     () => '—',
  'af-inspby':       () => '—',
  'af-inspid':       () => '—',
  'af-certid':       () => '—',
  'af-defectcode':   () => '—',
  'af-defecttext':   () => '—',
  'af-defectid':     () => '—',
  'af-maindefcode':  () => '—',
  'af-maindeftext':  () => '—',
  'af-defitemcode':  () => '—',
  'af-natdefcode':   () => '—',
  'af-natdefdecode': () => '—',
  'af-action1':      () => '—',
  'af-action2':      () => '—',
  'af-action3':      () => '—',
  'af-actioncd1':    () => '—',
  'af-actioncd2':    () => '—',
  'af-actioncd3':    () => '—',
  'af-otheraction':  () => '—',
  'af-detentionrsn': () => '—',
  'af-classresp':    () => '—',
  'af-recognorg':    () => '—',
  'af-recognorgcd':  () => '—',
  'af-recognorgyn':  () => '—',
  'af-otherrecog':   () => '—',
  'af-accidental':   () => '—',

  // === SAFETY → Insurance ===
  'af-pi':           v => v.pi,
  'af-picode':       () => '—',

  // === SAFETY → Ballast Water ===
  'af-bwmp':         () => '—',
  'af-bwmpt':        () => '—',
  'af-bwmpe':        () => '—',
  'af-bwmpet':       () => '—',
  'af-bwmpmfr':      () => '—',
  'af-bwmpmodel':    () => '—',
  'af-bwmpclass':    () => '—',
  'af-sbtprotect':   () => '—',
  'af-sbtcap':       () => '—',
  'af-cbt':          () => '—',

  // === CARGO → Containers ===
  'af-teu':          v => v.teu || '—',
  'af-teu14t':       v => v.teu_r || '—',
  'af-fitcont':      v => v.teu ? 'Yes' : '—',
  'af-hatchless':    () => '—',

  // === CARGO → Bulk / Grain ===
  'af-grain':        () => '—',
  'af-bale':         () => '—',
  'af-holds':        v => v.holds || '—',
  'af-hatches':      v => v.hatches || '—',
  'af-lghatchb':     () => '—',
  'af-lghatchl':     () => '—',
  'af-holdnarr':     () => '—',
  'af-hatchnarr':    () => '—',
  'af-heavyload':    () => '—',
  'af-timbdeck':     () => '—',

  // === CARGO → Liquid / Tanker ===
  'af-liquidcap':    () => '—',
  'af-pumpcap':      () => '—',
  'af-cargopumps':   () => '—',
  'af-cargotanks':   () => '—',
  'af-sloptanks':    () => '—',
  'af-notanks':      () => '—',
  'af-cow':          v => v.ty === 'Oil Tanker' ? 'Yes' : '—',
  'af-igs':          v => ['Oil Tanker','Chemical Tanker','LNG Carrier','LPG Carrier'].includes(v.ty) ? 'Yes' : '—',
  'af-bowdisch':     () => '—',
  'af-bowload':      () => '—',
  'af-sterndisch':   () => '—',
  'af-sternload':    () => '—',
  'af-spm':          () => '—',
  'af-vaporrec':     () => '—',
  'af-closedload':   () => '—',
  'af-cargogrdseg':  () => '—',
  'af-flashover':    () => '—',
  'af-flashunder':   () => '—',
  'af-heatingcoils': () => '—',
  'af-heatcoilmat':  () => '—',
  'af-heatexch':     () => '—',
  'af-heatexchmat':  () => '—',
  'af-tankcoat':     () => '—',
  'af-slopcoat':     () => '—',
  'af-tankcoatnarr': () => '—',
  'af-slopslotcap':  () => '—',
  'af-imo1':         () => '—',
  'af-imo2':         () => '—',
  'af-imo3':         () => '—',
  'af-aspbitumen':   () => '—',
  'af-tanknot':      () => '—',
  'af-tanknarr':     () => '—',
  'af-sptanknarr':   () => '—',
  'af-spectknarr':   () => '—',
  'af-cargonarr':    () => '—',
  'af-cargoothertp': () => '—',
  'af-cargoothercap':() => '—',

  // === CARGO → Gas / LNG / LPG ===
  'af-gascap':       () => '—',
  'af-lngready':     v => v.ty === 'LNG Carrier' ? 'Yes' : '—',
  'af-reliq':        () => '—',
  'af-regas':        () => '—',
  'af-fullpress':    v => v.ty === 'LPG Carrier' ? 'Yes' : '—',
  'af-fullref':      v => v.ty === 'LNG Carrier' ? 'Yes' : '—',
  'af-semipressref': () => '—',
  'af-liqh2':        () => '—',
  'af-ammonia-cargo':() => '—',
  'af-ethane-cargo': () => '—',
  'af-ethylene':     () => '—',
  'af-vcm':          () => '—',
  'af-bunkmethanol': () => '—',

  // === CARGO → Passengers ===
  'af-paxcap':       v => v.pax || '—',
  'af-paxberth':     v => v.pax || '—',
  'af-cabins':       () => '—',

  // === CARGO → RoRo / Vehicles ===
  'af-rorof':        v => v.ty === 'RoRo' || v.ty === 'Car Carrier' ? 'Yes' : '—',
  'af-rororamps':    () => '—',
  'af-rorolanes':    () => '—',
  'af-lanm':         () => '—',
  'af-clearroro':    () => '—',
  'af-rorolanelen':  () => '—',
  'af-lanesnarr':    () => '—',
  'af-cars':         () => '—',
  'af-ceu':          v => v.ceu || '—',
  'af-ramppos':      () => '—',
  'af-ramplen':      () => '—',
  'af-rampwid':      () => '—',
  'af-rampswl':      () => '—',
  'af-rampincup':    () => '—',
  'af-rampincdn':    () => '—',
  'af-rampaxl':      () => '—',
  'af-ramptype':     () => '—',

  // === CARGO → Reefer ===
  'af-reeferpts':    () => '—',
  'af-inscap':       () => '—',
  'af-tempmax':      () => '—',
  'af-tempmin':      () => '—',
  'af-refmachre':    () => '—',
  'af-refmachnre':   () => '—',
  'af-fitreefcont':  () => '—',

  // === CARGO → Offshore / Misc ===
  'af-bollardpull':  () => '—',
  'af-cleardeck':    () => '—',
  'af-accommodation':() => '—',

  // === COMPLIANCE → Sanctions ===
  'af-ofac':         () => 'No',
  'af-eu':           () => 'No',
  'af-un':           () => 'No',
  'af-uk':           () => 'No',
  'af-swiss':        () => 'No',
  'af-uae':          () => 'No',
  'af-can':          () => 'No',
  'af-aus':          () => 'No',
  'af-fatf':         () => '—',
  'af-ofacsdnco':    () => 'No',
  'af-ofacssi':      () => 'No',

  // === COMPLIANCE → Behavioral Analytics ===
  'af-dark':         () => 'No',
  'af-sts':          () => '—',
}

export function getAttrValue(vessel, nodeId) {
  const fn = MAP[nodeId]
  if (!fn || !vessel) return ''
  try {
    const v = fn(vessel)
    return v == null ? '' : String(v)
  } catch {
    return ''
  }
}

// Maps leaf node IDs → (entity key + field label) for temporal change detection
export const LEAF_TEMPORAL_MAP = {
  'af-status':       { entity: 'imo',       label: 'Vessel Status'           },
  'af-mmsi':         { entity: 'imo',       label: 'MMSI'                    },
  'af-callsign':     { entity: 'imo',       label: 'Call Sign'               },
  'af-name':         { entity: 'imo',       label: 'Vessel Name (Current)'   },
  'af-flag':         { entity: 'flag',      label: 'Flag State'              },
  'af-por':          { entity: 'flag',      label: 'Port of Registry'        },
  'af-owner':        { entity: 'ownership', label: 'Registered Owner'        },
  'af-benowner':     { entity: 'ownership', label: 'Beneficial Owner'        },
  'af-operator':     { entity: 'ownership', label: 'Commercial Operator'     },
  'af-manager':      { entity: 'ownership', label: 'Technical Manager'       },
  'af-docco':        { entity: 'ownership', label: 'DOC Company'             },
  'af-pi':           { entity: 'ownership', label: 'P&I Club'                },
  'af-class':        { entity: 'class',     label: 'Classification Society'  },
  'af-classnot':     { entity: 'class',     label: 'Class Notation'          },
  'af-specsurvlast': { entity: 'class',     label: 'Last Special Survey'     },
  'af-specsurvnext': { entity: 'class',     label: 'Next Special Due'        },
  'af-annsurvlast':  { entity: 'class',     label: 'Last Annual Survey'      },
  'af-annsurvnext':  { entity: 'class',     label: 'Next Annual Due'         },
  'af-drydocklast':  { entity: 'class',     label: 'Last Intermediate Survey'},
  'af-smcissued':    { entity: 'certs',     label: 'SMC (ISM)'               },
  'af-docissued':    { entity: 'certs',     label: 'DOC'                     },
}

import { getEntityFieldsAtDate } from './vesselTimeline'

export function getAttrValueAtDate(vessel, nodeId, curDate) {
  if (!curDate || curDate >= '2024-01-30' || !vessel) return getAttrValue(vessel, nodeId)
  const m = LEAF_TEMPORAL_MAP[nodeId]
  if (!m) return getAttrValue(vessel, nodeId)
  try {
    const hist = getEntityFieldsAtDate(vessel, m.entity, curDate)
    const fld  = hist.find(f => f[0] === m.label)
    return fld ? String(fld[1]) : getAttrValue(vessel, nodeId)
  } catch {
    return getAttrValue(vessel, nodeId)
  }
}
