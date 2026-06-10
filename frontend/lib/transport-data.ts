// turbo.az səviyyəsində marka və model bazası
export const CAR_BRANDS: { name: string; models: string[] }[] = [
  { name: 'Acura', models: ['CL','ILX','MDX','RDX','RL','TL','TLX','TSX','ZDX'] },
  { name: 'Alfa Romeo', models: ['145','155','156','159','164','Giulia','Giulietta','MiTo','Stelvio'] },
  { name: 'Aston Martin', models: ['DB9','DB11','DBS','Rapide','Vantage','Vanquish'] },
  { name: 'Audi', models: ['A1','A3','A4','A5','A6','A7','A8','Q2','Q3','Q5','Q7','Q8','R8','RS3','RS4','RS6','RS7','S3','S4','S5','S6','S7','S8','TT','e-tron'] },
  { name: 'BMW', models: ['1 Series','2 Series','3 Series','4 Series','5 Series','6 Series','7 Series','8 Series','X1','X2','X3','X4','X5','X6','X7','Z3','Z4','M3','M5','M6','i3','i4','i7','iX'] },
  { name: 'BYD', models: ['Atto 3','Dolphin','Han','Seal','Song','Tang','Yuan'] },
  { name: 'Cadillac', models: ['ATS','CT4','CT5','CT6','CTS','Escalade','SRX','STS','XT4','XT5','XT6','XTS'] },
  { name: 'Chery', models: ['Arrizo','QQ','Tiggo 2','Tiggo 4','Tiggo 7','Tiggo 8','Tiggo 9'] },
  { name: 'Chevrolet', models: ['Aveo','Camaro','Captiva','Cobalt','Corvette','Cruze','Equinox','Express','Impala','Lacetti','Malibu','Niva','Spark','Suburban','Tahoe','Trailblazer','Trax','Volt'] },
  { name: 'Chrysler', models: ['200','300','300C','Crossfire','Pacifica','PT Cruiser','Sebring','Voyager'] },
  { name: 'Citroën', models: ['Berlingo','C1','C2','C3','C4','C5','C6','DS3','DS4','DS5','Jumper','Jumpy','Nemo','Saxo','Xsara'] },
  { name: 'Daewoo', models: ['Espero','Gentra','Lacetti','Lanos','Leganza','Magnus','Matiz','Nexia','Nubira'] },
  { name: 'Dacia', models: ['Duster','Logan','Sandero','Spring'] },
  { name: 'Dodge', models: ['Caliber','Caravan','Challenger','Charger','Durango','Journey','Magnum','Nitro','Ram','Stratus'] },
  { name: 'Fiat', models: ['125','126','127','500','500L','500X','Bravo','Doblo','Ducato','Linea','Marea','Panda','Punto','Stilo','Tipo','Uno'] },
  { name: 'Ford', models: ['B-Max','C-Max','EcoSport','Edge','Escape','Escort','Explorer','F-150','Fiesta','Focus','Fusion','Galaxy','Kuga','Mondeo','Mustang','Ranger','S-Max','Sierra','Transit'] },
  { name: 'GAZ', models: ['21','24','3110','3302 Gazel','Gazel','Sobol','Volga'] },
  { name: 'Geely', models: ['Atlas','Coolray','Emgrand','Monjaro','Tugella'] },
  { name: 'GMC', models: ['Acadia','Canyon','Envoy','Sierra','Suburban','Terrain','Yukon'] },
  { name: 'Great Wall', models: ['Haval','Hover','Wingle'] },
  { name: 'Honda', models: ['Accord','City','Civic','CR-V','CR-Z','Element','Fit','FR-V','HR-V','Insight','Jazz','Legend','Odyssey','Pilot','Prelude','Ridgeline','S2000','Stream'] },
  { name: 'Hummer', models: ['H1','H2','H3'] },
  { name: 'Hyundai', models: ['Accent','Atos','Azera','Coupe','Creta','Elantra','Equus','Galloper','Genesis','Getz','Grandeur','H100','H200','i10','i20','i30','i40','ix35','ix55','Matrix','Palisade','Santa Fe','Solaris','Sonata','Starex','Terracan','Tucson','Veloster','Veracruz'] },
  { name: 'Infiniti', models: ['EX35','FX35','FX45','FX50','G25','G35','G37','I30','JX35','M30','M35','M37','Q30','Q50','Q60','Q70','QX30','QX50','QX56','QX60','QX70','QX80'] },
  { name: 'Iran Khodro', models: ['Dena','Runna','Samand','Soren'] },
  { name: 'Jaguar', models: ['E-Pace','F-Pace','F-Type','I-Pace','S-Type','X-Type','XE','XF','XJ','XK'] },
  { name: 'Jeep', models: ['Cherokee','Commander','Compass','Grand Cherokee','Liberty','Patriot','Renegade','Wrangler'] },
  { name: 'Kia', models: ['Bongo','Carens','Carnival','Cee\'d','Cerato','Cerato Forte','Clarus','Forte','K2700','K3','K4','K5','K7','K8','K9','Magentis','Mohave','Niro','Opirus','Optima','Picanto','Pride','Quoris','Rio','Sephia','Shuma','Sorento','Soul','Spectra','Sportage','Stinger','Telluride','Venga'] },
  { name: 'KrAZ', models: ['255','260','6322','6510'] },
  { name: 'Lada (VAZ)', models: ['1111 Ока','2101','2102','2103','2104','2105','2106','2107','2108','2109','2110','2111','2112','2113','2114','2115','2120','2121 (4x4)','2123','2129','2131','2170 Priora','2190 Granta','Granta','Kalina','Largus','Niva','Niva Travel','Priora','Samara','Vesta','XRAY'] },
  { name: 'Lamborghini', models: ['Aventador','Diablo','Gallardo','Huracan','Urus'] },
  { name: 'Land Rover', models: ['Defender','Discovery','Discovery Sport','Freelander','Range Rover','Range Rover Evoque','Range Rover Sport','Range Rover Velar'] },
  { name: 'Lexus', models: ['CT','ES','GS','GX','IS','LC','LFA','LS','LX','NX','RC','RX','SC','UX'] },
  { name: 'Lincoln', models: ['Aviator','Continental','Corsair','MKC','MKS','MKT','MKX','MKZ','Nautilus','Navigator','Town Car'] },
  { name: 'Maserati', models: ['Ghibli','GranTurismo','Levante','Quattroporte'] },
  { name: 'Mazda', models: ['2','3','5','6','626','929','B-Series','BT-50','CX-3','CX-30','CX-5','CX-7','CX-9','Demio','MPV','MX-3','MX-5','MX-6','Premacy','RX-7','RX-8','Tribute','Xedos'] },
  { name: 'Mercedes-Benz', models: ['190','A-Class','AMG GT','B-Class','C-Class','CL','CLA','CLK','CLS','E-Class','EQA','EQB','EQC','EQE','EQS','EQV','G-Class','GL','GLA','GLB','GLC','GLE','GLK','GLS','M-Class','ML','R-Class','S-Class','SL','SLC','SLK','SLS','Sprinter','V-Class','Vaneo','Viano','Vito','X-Class'] },
  { name: 'Mini', models: ['Cooper','Cooper S','Countryman','Hatch','One','Paceman','Roadster'] },
  { name: 'Mitsubishi', models: ['3000 GT','ASX','Carisma','Colt','Eclipse','Galant','Grandis','L200','Lancer','Mirage','Montero','Outlander','Pajero','RVR','Space Star','Space Wagon','Xpander'] },
  { name: 'Moskvich', models: ['2140','2141','3','402','407','408','412'] },
  { name: 'Nissan', models: ['350Z','370Z','Almera','Altima','Armada','Bluebird','Cefiro','Cube','Frontier','GT-R','Juke','Laurel','Leaf','Maxima','Micra','Murano','Navara','Note','Pathfinder','Patrol','Pickup','Primera','Pulsar','Qashqai','Quest','Rogue','Sentra','Skyline','Sunny','Teana','Terrano','Tiida','Titan','Versa','X-Trail'] },
  { name: 'Opel', models: ['Agila','Ampera','Antara','Astra','Calibra','Combo','Corsa','Frontera','Insignia','Kadett','Meriva','Mokka','Monterey','Movano','Omega','Senator','Sintra','Tigra','Vectra','Vita','Vivaro','Zafira'] },
  { name: 'Peugeot', models: ['106','107','108','206','207','208','3008','301','307','308','405','406','407','408','5008','508','607','807','Boxer','Partner','RCZ','Traveller'] },
  { name: 'Porsche', models: ['718','911','918','Boxster','Cayenne','Cayman','Macan','Panamera','Taycan'] },
  { name: 'Range Rover', models: ['Evoque','Sport','Velar','Vogue'] },
  { name: 'Renault', models: ['Captur','Clio','Espace','Fluence','Kadjar','Kangoo','Koleos','Laguna','Latitude','Logan','Megane','Modus','Sandero','Scenic','Symbol','Trafic','Twingo'] },
  { name: 'Rolls-Royce', models: ['Cullinan','Ghost','Phantom','Wraith'] },
  { name: 'Saab', models: ['9-3','9-5','9-7X','900','9000'] },
  { name: 'SEAT', models: ['Alhambra','Altea','Arona','Ateca','Cordoba','Ibiza','Leon','Toledo'] },
  { name: 'Škoda', models: ['Citigo','Fabia','Felicia','Karoq','Kodiaq','Octavia','Rapid','Roomster','Superb','Yeti'] },
  { name: 'Smart', models: ['City-Coupe','Forfour','Fortwo','Roadster'] },
  { name: 'SsangYong', models: ['Actyon','Korando','Kyron','Musso','Rexton','Rodius','Tivoli'] },
  { name: 'Subaru', models: ['B9 Tribeca','Brat','BRZ','Forester','Impreza','Justy','Legacy','Outback','SVX','Tribeca','WRX','XV'] },
  { name: 'Suzuki', models: ['Aerio','Alto','Baleno','Cultus','Esteem','Forenza','Grand Vitara','Ignis','Jimny','Kizashi','Liana','Reno','Samurai','Sidekick','Splash','Swift','SX4','Verona','Vitara','Wagon R','XL7'] },
  { name: 'Tesla', models: ['Cybertruck','Model 3','Model S','Model X','Model Y','Roadster'] },
  { name: 'Toyota', models: ['4Runner','Alphard','Auris','Avalon','Avensis','Aygo','C-HR','Camry','Carina','Celica','Corolla','Corona','Cressida','Crown','Echo','FJ Cruiser','Fortuner','Harrier','Hiace','Highlander','Hilux','iQ','Kluger','Land Cruiser','Land Cruiser Prado','MR2','Picnic','Previa','Prius','Probox','RAV4','Rush','Scion','Sequoia','Sienna','Solara','Starlet','Supra','Tacoma','Tercel','Tundra','Venza','Verso','Vios','Vitz','Voxy','Wish','Yaris'] },
  { name: 'UAZ', models: ['3151','3160','3163 Patriot','452 Bukhanka','469','Hunter','Patriot','Pickup'] },
  { name: 'VAZ', models: ['1111','2101','2102','2103','2104','2105','2106','2107','2108','2109','2110','2111','2112','2113','2114','2115','2121','2123','2129','2131'] },
  { name: 'Volkswagen', models: ['Amarok','Arteon','Beetle','Bora','Caddy','California','Caravelle','Crafter','Eos','Fox','Golf','Golf Plus','ID.3','ID.4','ID.5','ID.6','Jetta','Lupo','Multivan','New Beetle','Passat','Phaeton','Polo','Routan','Scirocco','Sharan','Tiguan','Touareg','Touran','Transporter','Up','Vento'] },
  { name: 'Volvo', models: ['240','340','440','460','480','740','760','780','850','940','960','C30','C70','S40','S60','S70','S80','S90','V40','V50','V60','V70','V90','XC40','XC60','XC70','XC90'] },
  { name: 'ZAZ', models: ['1102','1103','1105 Dana','110557','Chance','Forza','Sens','Tavria','Vida'] },
  { name: 'Yutong', models: ['ZK6122','ZK6938','ZK6116','ZK6831','ZK6852'] },
  { name: 'ZX Auto', models: ['Admiral','Grand Tiger','Landmark'] },
];

export const BODY_TYPES = [
  'Sedan','Hetçbek','Lyuks','Universal','Vendor','Pikap','Kupe','Kabriolet','Mikroavtobus','Avtobus','Cipdə (SUV)','Krossover','Limuzin','Furqon','Yük maşını',
];

export const FUEL_TYPES = [
  'Benzin','Dizel','Elektrik','Hibrid','Plug-in Hibrid','Qaz','Benzin/Qaz',
];

export const TRANSMISSION_TYPES = [
  'Avtomat','Mexaniki','Robotlaşdırılmış','Variator (CVT)','Tiptronik',
];

export const DRIVETRAIN_TYPES = [
  { value: 'fwd', label: 'Ön təkər (FWD)' },
  { value: 'rwd', label: 'Arxa təkər (RWD)' },
  { value: '4wd', label: 'Tam ötürücü (4WD)' },
  { value: 'awd', label: 'Daimi tam ötürücü (AWD)' },
];

export const COLORS = [
  'Ağ','Qara','Boz','Gümüş','Mavi','Qırmızı','Yaşıl','Sarı','Qəhvəyi','Bej','Narıncı','Bənövşəyi','Qızılı','Çəhrayı',
];

export const MARKET_FROM = [
  { value: 'koreya',  label: 'Koreya' },
  { value: 'amerika', label: 'Amerika' },
  { value: 'avropa',  label: 'Avropa' },
  { value: 'yaponya', label: 'Yaponiya' },
  { value: 'cin',     label: 'Çin' },
  { value: 'rusiya',  label: 'Rusiya' },
  { value: 'azerbaycan', label: 'Azərbaycan' },
];

export const SELLER_KIND = [
  { value: 'private', label: 'Şəxsi' },
  { value: 'dealer',  label: 'Salon (diler)' },
  { value: 'shop',    label: 'Mağaza' },
];

export const EQUIPMENT = [
  'Yüngül lehimli disklər',
  'ABS',
  'Lyuk',
  'Yağış sensoru',
  'Mərkəzi qapanma',
  'Park radarı',
  'Kondisioner',
  'Klimat kontrol',
  'Oturacaqların isidilməsi',
  'Oturacaqların ventilyasiyası',
  'Dəri salon',
  'Kserion lampalar',
  'LED işıqlar',
  '360° kamera',
  'Arxa görüntü kamerası',
  'Yan pərdələr',
  'Cruise control',
  'Adaptiv cruise',
  'Lane assist',
  'Apple CarPlay',
  'Android Auto',
  'Naviqasiya',
  'Bluetooth',
  'USB port',
  'Elektrik baqaj qapısı',
  'Keyless go',
  'Push-button start',
  'Yaddaşlı oturacaq',
  'Heads-up display',
  'Massajlı oturacaq',
];
