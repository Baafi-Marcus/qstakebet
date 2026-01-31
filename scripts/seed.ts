import "dotenv/config";
import { db } from "../lib/db";
import { matches, schools } from "../lib/db/schema";


interface SeedSchool {
    name: string;
    type: string;
    district: string;
}

const SEED_SCHOOL_DATA: Record<string, SeedSchool[]> = {
    "Ahafo": [
        { "name": "Acherensua Senior High", "type": "Senior High School", "district": "Asutifi South" },
        { "name": "Ahafoman Senior High/Tech", "type": "Senior High Technical School", "district": "Asunafo North" },
        { "name": "Bechem Presby Senior High", "type": "Senior High School", "district": "Tano South" },
        { "name": "Danso Agyei Senior high technical", "type": "Senior High Technical School", "district": "Asutifi South" },
        { "name": "Derma Comm. Day School", "type": "Senior High School", "district": "Tano South" },
        { "name": "Gyamfi Kumanini Senior High/Tech", "type": "Senior High Technical School", "district": "Asutifi North" },
        { "name": "Hwidiem Senior High", "type": "Senior High School", "district": "Asutifi South" },
        { "name": "Kukuom Agric Senior High", "type": "Senior High School", "district": "Asunafo South" },
        { "name": "Mim Senior High", "type": "Senior High School", "district": "Asunafo North" },
        { "name": "OLA Girls Senior High, Kenyasi", "type": "Senior High School", "district": "Asutifi North" },
        { "name": "Samuel Otu Presby Senior High.", "type": "Senior High School", "district": "Tano South" },
        { "name": "Sankore Senior High", "type": "Senior High School", "district": "Asunafo South" },
        { "name": "Serwaa Kesse Girls Senior High", "type": "Senior High School", "district": "Tano North" },
        { "name": "Terchire Senior High", "type": "Senior High School", "district": "Tano North" },
        { "name": "Twereku Ampem SHS", "type": "Senior High School", "district": "Asutifi North" },
        { "name": "Yamfo Anglican SHS", "type": "Senior High School", "district": "Tano North" }
    ],
    "Ashanti": [
        { "name": "Achinakrom Senior High", "type": "Senior High School", "district": "Ejisu" },
        { "name": "Adanwomase Senior High", "type": "Senior High School", "district": "Kwabre East" },
        { "name": "Adobewora Comm. Senior High", "type": "Senior High School", "district": "Atwima-Mponua" },
        { "name": "Adu Gyamfi Senior High", "type": "Senior High School", "district": "Sekyere South" },
        { "name": "Adventist Girls Senior High, Ntonso", "type": "Senior High School", "district": "Kwabre East" },
        { "name": "Adventist Senior High, Kumasi", "type": "Senior High School", "district": "Kumasi" },
        { "name": "Afigya Senior High/Tech", "type": "Senior High Technical School", "district": "Afigya-Kwabre North" },
        { "name": "Afua Kobi Ampem Girls' Senior High", "type": "Senior High School", "district": "Atwima-Kwanwoma" },
        { "name": "Agogo State College", "type": "Senior High School", "district": "Asante-Akim North" },
        { "name": "Agona Senior High/Tech", "type": "Senior High Technical School", "district": "Sekyere South" },
        { "name": "Agric Nzema Senior High, Kumasi", "type": "Senior High School", "district": "Kwadaso" },
        { "name": "Akrofuom Senior High/Tech", "type": "Senior High Technical School", "district": "Akrofuom" },
        { "name": "Akumadan Senior High", "type": "Senior High School", "district": "Offinso North" },
        { "name": "Akwesi Awobaa Senior High/Tech", "type": "Senior High Technical School", "district": "Ejura/Sekyedumase" },
        { "name": "Al-Azariya Islamic Snr. Higi, Kumasi", "type": "Senior High School", "district": "Kumasi" }
    ],
    "Bono": [
        { "name": "Badu Senior High/Tech.", "type": "Senior High Technical School", "district": "Tain" },
        { "name": "Bandaman Senior High", "type": "Senior High School", "district": "Banda" },
        { "name": "Chiraa Senior High", "type": "Senior High School", "district": "Sunyani West" },
        { "name": "Diamono Senior High Sch.", "type": "Senior High School", "district": "Jaman North" },
        { "name": "Dormaa Senior High", "type": "Senior High School", "district": "Dormaa Central" },
        { "name": "Drobo Senior High", "type": "Senior High School", "district": "Jaman South" },
        { "name": "Duadaso No. 1 Senior High/Tech.", "type": "Senior High School", "district": "Jaman North" },
        { "name": "Goka Senior High/Tech.", "type": "Senior High Technical School", "district": "Jaman North" },
        { "name": "Hidaayah Islamic SHS", "type": "Senior High Technical School", "district": "Jaman South" },
        { "name": "Koase Senior High/Tech", "type": "Senior High School", "district": "Wenchi" },
        { "name": "Kyem Amponsah SHS, Fiapre", "type": "Senior High Technical School", "district": "Sunyani West" },
        { "name": "lstiquaama Snr. High", "type": "Senior High School", "district": "Wenchi" },
        { "name": "Mansen Senior High", "type": "Senior High School", "district": "Dormaa East" },
        { "name": "Menji Senior High", "type": "Senior High School", "district": "Tain" },
        { "name": "Nafana Senior High", "type": "Senior High School", "district": "Jaman North" }
    ],
    "Bono East": [
        { "name": "Abrafi Senior High", "type": "Senior High School", "district": "Techiman North" },
        { "name": "Akumfi Ameyaw Senior High/Tech.", "type": "Senior High Technical School", "district": "Techiman North" },
        { "name": "Amanten Senior High", "type": "Senior High School", "district": "Atebubu-Amantin" },
        { "name": "Atebubu Senior High", "type": "Senior High School", "district": "Atebubu-Amantin" },
        { "name": "Bassa Community Senior High", "type": "Senior High Technical School", "district": "Sene East" },
        { "name": "Busunya Senior High", "type": "Senior High School", "district": "Nkoranza North" },
        { "name": "Donkro- Nkwanta SHS", "type": "Senior High School", "district": "Nkoranza South" },
        { "name": "Guakro Effah Senior High", "type": "Senior High School", "district": "Techiman North" },
        { "name": "Gyarko Comm. Day Senior High", "type": "Senior High School", "district": "Techiman" },
        { "name": "Jema Senior High", "type": "Senior High School", "district": "Kintampo South" },
        { "name": "Kajaji Senior High", "type": "Senior High School", "district": "Sene East" },
        { "name": "Kesse Basahyia SHS", "type": "Senior High School", "district": "Techiman" },
        { "name": "Kintampo Senior High", "type": "Senior High School", "district": "Kintampo North" },
        { "name": "Krobo Comm.Senior High", "type": "Senior High School", "district": "Techiman North" },
        { "name": "Kwabre Senior High", "type": "Senior High School", "district": "Nkoranza South" }
    ],
    "Central": [
        { "name": "Abakrampa Senior High/Tech", "type": "Senior High Technical School", "district": "Abura/Asebu/Kwamankese" },
        { "name": "Aburaman Senior High", "type": "Senior High School", "district": "Abura/Asebu/Kwamankese" },
        { "name": "Academy of Christ the King", "type": "Senior High School", "district": "Cape Coast" },
        { "name": "Adankwaman Senior High", "type": "Senior High School", "district": "Assin South" },
        { "name": "Adisadel College", "type": "Senior High School", "district": "Cape Coast" },
        { "name": "Aggrey Mem. A.M.E.Zion Snr. High", "type": "Senior High School", "district": "Abura/Asebu/Kwamankese" },
        { "name": "Agona Namonwora Comm.Senior High", "type": "Senior High Technical School", "district": "Agona East" },
        { "name": "Akyin SHS", "type": "Senior High Technical School", "district": "Ekumfi" },
        { "name": "Assin Manso Senior High", "type": "Senior High Technical School", "district": "Assin South" },
        { "name": "Assin North Senior High/Tech", "type": "Senior High Technical School", "district": "Assin North" },
        { "name": "Assin Nsuta SHS", "type": "Senior High School", "district": "Assin South" },
        { "name": "Assin State College", "type": "Senior High School", "district": "Assin North" },
        { "name": "Awutu Bawjiase Comm. SHS", "type": "Senior High School", "district": "Awutu Senya East" },
        { "name": "Awutu Winton Senior High", "type": "Senior High School", "district": "Awutu Senya West" },
        { "name": "Ayanfuri Senior High", "type": "Senior High School", "district": "Upper Denkyira West" }
    ],
    "Eastern": [
        { "name": "Abetifi Presby Senior High", "type": "Senior High School", "district": "Kwahu East" },
        { "name": "Abomosu STEM Senior High", "type": "Senior High School", "district": "Atiwa West" },
        { "name": "Abuakwa State College", "type": "Senior High School", "district": "Abuakwa South" },
        { "name": "Achiase Senior High", "type": "Senior High School", "district": "Achiase" },
        { "name": "Adeiso Presby Senior High", "type": "Senior High School", "district": "Upper West Akim" },
        { "name": "Adjena Senior High/Tech.", "type": "Senior High School", "district": "Asuogyaman" },
        { "name": "Akim Asafo Senior High", "type": "Senior High School", "district": "Abuakwa South" },
        { "name": "Akim Swedru Senior High", "type": "Senior High School", "district": "Birim South" },
        { "name": "Akokoaso Senior High/Tech", "type": "Senior High School", "district": "Akyemansa" },
        { "name": "Akro Senior High/Tech", "type": "Senior High School", "district": "Lower Manya Krobo" },
        { "name": "Akroso Senior High/Tech", "type": "Senior High School", "district": "Asene Manso Akroso" },
        { "name": "Akuse Methodist Senior High/Tech", "type": "Senior High Technical School", "district": "Lower Manya Krobo" },
        { "name": "Akwamuman Senior High", "type": "Senior High School", "district": "Asuogyaman" },
        { "name": "AMeaman Senior High", "type": "Senior High School", "district": "Asene Manso Akroso" },
        { "name": "Amuana Praso Senior High", "type": "Senior High Technical School", "district": "Birim North" }
    ],
    "Greater Accra": [
        { "name": "Accra Academy", "type": "Senior High School", "district": "Accra" },
        { "name": "Accra Girls Senior High .", "type": "Senior High School", "district": "Ayawaso North" },
        { "name": "Accra Senior High", "type": "Senior High Technical School", "district": "Accra" },
        { "name": "Accra STEM Academy", "type": "Senior High School", "district": "Ayawaso West" },
        { "name": "Accra Wesley Girls High", "type": "Senior High School", "district": "Accra" },
        { "name": "Achimota Senior High", "type": "Senior High School", "district": "Okaikwei North" },
        { "name": "Ada Senior High", "type": "Senior High School", "district": "Ada East" },
        { "name": "Adjen Kotoku Senior High", "type": "Senior High Technical School", "district": "Ga West" },
        { "name": "Akramaman Senior High", "type": "Senior High School", "district": "Ga West" },
        { "name": "Amasaman Senior High/Tech", "type": "Senior High School", "district": "Ga West" },
        { "name": "Bortianor SHS", "type": "Senior High School", "district": "Ga South" },
        { "name": "Chemu Senior High/Tech", "type": "Senior High Technical School", "district": "Tema Metropolitan" },
        { "name": "Christian Methodist Senior High", "type": "Senior High School", "district": "Ga South" },
        { "name": "Ebenezer Senior High", "type": "Senior High Technical School", "district": "Accra" },
        { "name": "Forces Senior High/Tech, Burma Camp", "type": "Senior High Technical School", "district": "La-Dade-Kotopon" }
    ],
    "North East": [
        { "name": "Chereponi Senior High/Tech.", "type": "Senior High Technical School", "district": "Chereponi" },
        { "name": "Gambaga Girls Senior High", "type": "Senior High Technical School", "district": "East Mamprusi" },
        { "name": "Gbintiri Senior High/Tech", "type": "Senior High School", "district": "East Mamprusi" },
        { "name": "Janga Senior High/Tech", "type": "Senior High School", "district": "West Mamprusi" },
        { "name": "Kpasenpke STEM Senior High", "type": "Senior High School", "district": "West Mamprusi" },
        { "name": "Langbinsi Senior High/Tech", "type": "Senior High School", "district": "East Mamprusi" },
        { "name": "Naferigu Senior High", "type": "Senior High Technical School", "district": "East Mamprusi" },
        { "name": "Nasuan SHS", "type": "Senior High School", "district": "Yunyoo-Nasuan" },
        { "name": "Sakogu Senior High/Tech", "type": "Senior High School", "district": "East Mamprusi" },
        { "name": "Walewate Senior High", "type": "Senior High School", "district": "West Mamprusi" },
        { "name": "Wulugu Senior High", "type": "Senior High School", "district": "West Mamprusi" },
        { "name": "Yagaba SHS", "type": "Senior High School", "district": "Mamprugu Moagduri" },
        { "name": "Yizesi SHS", "type": "Senior High School", "district": "Mamprugu Moagduri" },
        { "name": "Yunyoo SHS", "type": "Senior High School", "district": "Yunyoo-Nasuan" }
    ],
    "Northern": [
        { "name": "Anbariya Senior High Sch.", "type": "Senior High School", "district": "Tamale Metropolitan" },
        { "name": "Bimbiella Senior High", "type": "Senior High Technical School", "district": "Nanumba North Municipal" },
        { "name": "Business Senior High, Tamafe", "type": "Senior High School", "district": "Tamale Metropolitan" },
        { "name": "Dagbon State Senior High/Tech", "type": "Senior High School", "district": "Yendi Municipal" },
        { "name": "E. P. Agric Senior High/Tech.", "type": "Senior High School", "district": "Tatale Sanguli" },
        { "name": "Ghana SHS, Tamale Metropolitan", "type": "Senior High School", "district": "Tamale Metropolitan" },
        { "name": "Islamic Science Senior High, Tamafe", "type": "Senior High School", "district": "Sagnarigu Municipal" },
        { "name": "Kalpohin Senior High", "type": "Senior High School", "district": "Sagnarigu Municipal" },
        { "name": "Karaga Senior High", "type": "Senior High School", "district": "Karaga" },
        { "name": "Kasuliyili Senior High", "type": "Senior High Technical School", "district": "Tolon" },
        { "name": "Kumbungu Senior High", "type": "Senior High School", "district": "Kumbungu" },
        { "name": "Nanton Senior High/Tech", "type": "Senior High School", "district": "Nanton" },
        { "name": "Northern School of Business", "type": "Senior High Technical School", "district": "Sagnarigu Municipal" },
        { "name": "Nuriya Islamic Senior High, Tamate", "type": "Senior High Technical School", "district": "Tamale Metropolitan" },
        { "name": "Pong-Tamafe Senior High", "type": "Senior High School", "district": "Savelugu Municipal" }
    ],
    "Oti": [
        { "name": "Ahamansu Islamic SHS", "type": "Senior High Technical School", "district": "Kadjebi" },
        { "name": "Asukawkaw Senior High", "type": "Senior High School", "district": "Krachi East" },
        { "name": "Bagto Ridge Senior High/Tech.", "type": "Senior High Technical School", "district": "Jasikan" },
        { "name": "Biakoye Comm. School", "type": "Senior High Technical School", "district": "Biakoye" },
        { "name": "Bowiri Comm. Day Senior High/Tech.", "type": "Senior High School", "district": "Biakoye" },
        { "name": "Bueman Senior High .", "type": "Senior High School", "district": "Jasikan" },
        { "name": "Dodi-Papase Senior High/Tech", "type": "Senior High School", "district": "Kadjebi" },
        { "name": "Kadjebi-Asato Senior High", "type": "Senior High Technical School", "district": "Kadjebi" },
        { "name": "Kete Krachi Senior High/Tech.", "type": "Senior High Technical School", "district": "Krachi West" },
        { "name": "Kpassa Senior High/Tech", "type": "Senior High School", "district": "Nkwanta North" },
        { "name": "Krachi Senior High", "type": "Senior High School", "district": "Krachi West" },
        { "name": "Kyabobo Girls' School", "type": "Senior High School", "district": "Nkwanta South" },
        { "name": "Nchumuruman Comm. Day Senior High", "type": "Senior High School", "district": "Krachi Nchumuru" },
        { "name": "Nkonya SHS", "type": "Senior High Technical School", "district": "Biakoye" },
        { "name": "Nkwanta Comm.Senior High/Tech", "type": "Senior High School", "district": "Nkwanta South" }
    ],
    "Savannah": [
        { "name": "Bamboi Comm. Senior High", "type": "Senior High School", "district": "Bole" },
        { "name": "Bole Senior High", "type": "Senior High School", "district": "Bole" },
        { "name": "Buipe Senior High", "type": "Senior High School", "district": "Central Gonja" },
        { "name": "Daboya Comm. Day School", "type": "Senior High School", "district": "North Gonja" },
        { "name": "Damongo Senior High", "type": "Senior High Technical School", "district": "West Gonja" },
        { "name": "Larabanga Senior High", "type": "Senior High School", "district": "West Gonja" },
        { "name": "Mpaha Comm. SHS", "type": "Senior High Technical School", "district": "Central Gonja" },
        { "name": "Ndewura Jakpa Senior High/Tech.", "type": "Senior High School", "district": "West Gonja" },
        { "name": "Salaga Senior High", "type": "Senior High Technical School", "district": "East Gonja Municipal" },
        { "name": "Salaga T.I. Ahmad Senior High", "type": "Senior High Technical School", "district": "East Gonja Municipal" },
        { "name": "Sawla Senior High Sch.", "type": "Senior High School", "district": "Sawla-Tuna-Kalba" },
        { "name": "St. Anthony of Padua Senior High/Tech", "type": "Senior High School", "district": "Bole" },
        { "name": "Tuna Senior High/Tech.", "type": "Senior High School", "district": "Sawla-Tuna-Kalba" }
    ],
    "Upper East": [
        { "name": "Awe Senior High/Tech.", "type": "Senior High School", "district": "Kassena-Nankana Municipal" },
        { "name": "Azeem-Namoa Senior High/Tech", "type": "Senior High School", "district": "Bongo" },
        { "name": "Bawku Senior High", "type": "Senior High School", "district": "Bawku Municipal" },
        { "name": "Bawku Senior High/Tech.", "type": "Senior High School", "district": "Bawku Municipal" },
        { "name": "Binduri Comm. Day Senior High", "type": "Senior High School", "district": "Binduri" },
        { "name": "Bolga Sherigu Comm. Senior High", "type": "Senior High Technical School", "district": "Bolgatanga Municipal" },
        { "name": "Bolgatanga Senior High", "type": "Senior High School", "district": "Talensi" },
        { "name": "Bongo Senior High", "type": "Senior High School", "district": "Bongo" },
        { "name": "Bolga Girls Senior High", "type": "Senior High School", "district": "Bolgatanga Municipal" },
        { "name": "Chiana Senior High", "type": "Senior High School", "district": "Kassena-Nankana West" },
        { "name": "Fumbisi Senior High", "type": "Senior High School", "district": "Builsa South" },
        { "name": "Gambigo Comm. Day Senior High", "type": "Senior High School", "district": "Bolgatanga East" },
        { "name": "Garu Comm. Day Senior High", "type": "Senior High School", "district": "Garu" },
        { "name": "Gowrie Senior High/Tech.", "type": "Senior High School", "district": "Bongo" },
        { "name": "Kanjarga Comm. Senior High", "type": "Senior High Technical School", "district": "Builsa South" }
    ],
    "Upper West": [
        { "name": "Birifoh Senior High Sch.", "type": "Senior High School", "district": "Lawra Municipal" },
        { "name": "Daffiamah Senior High", "type": "Senior High School", "district": "Daffiama Bussie Issa" },
        { "name": "Eremon Senior High/Tech.", "type": "Senior High Technical School", "district": "Lawra Municipal" },
        { "name": "Funsi SHS", "type": "Senior High School", "district": "Wa East" },
        { "name": "Han Senior High", "type": "Senior High Technical School", "district": "Jirapa Municipal" },
        { "name": "Holy Family Senior High", "type": "Senior High School", "district": "Lambussie Karni" },
        { "name": "Islamic Senior High, Wa", "type": "Senior High School", "district": "Wa Municipal" },
        { "name": "Jamiat Al-Hidaya Islamic Girls", "type": "Senior High School", "district": "Wa Municipal" },
        { "name": "Jirapa Senior High", "type": "Senior High School", "district": "Jirapa Municipal" },
        { "name": "Kaleo Senior High/Tech", "type": "Senior High School", "district": "Nadowli-Kaleo" },
        { "name": "Ko Senior High", "type": "Senior High School", "district": "Nandom Municipal" },
        { "name": "Lambussie Comm. SHS", "type": "Senior High School", "district": "Lambussie Karni" },
        { "name": "Lassie-Tuofu Senior High", "type": "Senior High School", "district": "Wa West" },
        { "name": "Lawra Senior High", "type": "Senior High School", "district": "Lawra Municipal" },
        { "name": "Loggu Comm. Day School", "type": "Senior High Technical School", "district": "Wa East" }
    ],
    "Volta": [
        { "name": "Abor Senior High", "type": "Senior High Technical School", "district": "Keta Municipal" },
        { "name": "Abutia Senior High/Technical", "type": "Senior High Technical School", "district": "Ho West" },
        { "name": "Adaklu Senior High", "type": "Senior High Technical School", "district": "Adaklu District" },
        { "name": "Adidome Senior High", "type": "Senior High Technical School", "district": "Central Tongu" },
        { "name": "Aflao Community SHTS", "type": "Senior High Technical School", "district": "Ketu South Municipal" },
        { "name": "Afadjato Senior High/Tech.", "type": "Senior High Technical School", "district": "Hohoe Municipal" },
        { "name": "Afife Senior High Tech.", "type": "Senior High School", "district": "Ketu North Municipal" },
        { "name": "Agate Comm. Senior High", "type": "Senior High School", "district": "Afadzato South" },
        { "name": "Akatsi Senior High/Tech", "type": "Senior High Technical School", "district": "Akatsi South" },
        { "name": "Akome Senior High/Tech.", "type": "Senior High Technical School", "district": "Ho West" },
        { "name": "Anfoega Senior High", "type": "Senior High School", "district": "North Dayi" },
        { "name": "Anlo Afiadenyigba Senior High", "type": "Senior High School", "district": "Keta Municipal" },
        { "name": "Anlo Awomefia Senior High", "type": "Senior High Technical School", "district": "Keta Municipal" },
        { "name": "Anlo Senior High", "type": "Senior High School", "district": "Keta Municipal" },
        { "name": "Atavanyo Senior High/Tech.", "type": "Senior High School", "district": "Hohoe Municipal" }
    ],
    "Western": [
        { "name": "Adiembra Senior High", "type": "Senior High School", "district": "Sekondi Takoradi Metropolitan" },
        { "name": "Ahantaman Girls' Senior High", "type": "Senior High School", "district": "Shama" },
        { "name": "Amenfiman Senior High", "type": "Senior High School", "district": "Wassa Amenfi East" },
        { "name": "Annor Adjaye Senior High", "type": "Senior High School", "district": "Jomoro" },
        { "name": "Archbishop Porter Girls Snr.High .", "type": "Senior High School", "district": "Sekondi Takoradi Metropolitan" },
        { "name": "Asankrangwa Senior High", "type": "Senior High Technical School", "district": "Wassa Amenfi East" },
        { "name": "Asankrangwa Senior High/Tech", "type": "Senior High School", "district": "Wassa Amenfi East" },
        { "name": "Axim Girls Senior High", "type": "Senior High School", "district": "Nzema East Municipal" },
        { "name": "Baidoo Bonso Senior High/Tech", "type": "Senior High School", "district": "Ahanta West" },
        { "name": "Benso Senior High/Tech", "type": "Senior High School", "district": "Tarkwa-Nsuaem Municipal" },
        { "name": "Bompeh Senior High./Tech", "type": "Senior High Technical School", "district": "Sekondi Takoradi Metropolitan" },
        { "name": "Bonzo-Kaku Senior High", "type": "Senior High Technical School", "district": "Ellembelle" },
        { "name": "Daboase Senior High/Tech", "type": "Senior High Technical School", "district": "Mpohor" },
        { "name": "Diabene Senior High/Tech", "type": "Senior High School", "district": "Sekondi Takoradi Metropolitan" },
        { "name": "Esiama Senior High/Tech", "type": "Senior High Technical School", "district": "Ellembelle" }
    ],
    "Western North": [
        { "name": "Adabokrom Comm. SHS", "type": "Senior High School", "district": "Bia East" },
        { "name": "Adjoafua Comm. Senior High", "type": "Senior High Technical School", "district": "Bia West" },
        { "name": "Awaso STEM Senior High", "type": "Senior High School", "district": "Bibiani Anhwiaso Bekwai" },
        { "name": "Bia Senior High/Tech", "type": "Senior High Technical School", "district": "Bia West" },
        { "name": "Bibiani Senior High/Tech.", "type": "Senior High School", "district": "Bibiani Anhwiaso Bekwai" },
        { "name": "Bodi Senior High", "type": "Senior High School", "district": "Bodi" },
        { "name": "Chirano Comm. Day School", "type": "Senior High School", "district": "Bibiani Anhwiaso Bekwai" },
        { "name": "Dadieso Senior High", "type": "Senior High School", "district": "Suaman" },
        { "name": "Juaboso Senior High", "type": "Senior High School", "district": "Juaboso" },
        { "name": "Nana Brentu Senior High/Tech", "type": "Senior High Technical School", "district": "Aowin" },
        { "name": "Nanso-Amenfi Comm. Day School", "type": "Senior High Technical School", "district": "Suaman" },
        { "name": "Nsawora Edumafa SHS", "type": "Senior High School", "district": "Sefwi Akontombra" },
        { "name": "Queens Girls' Senior High, Sefwi Awhiaso", "type": "Senior High School", "district": "Bibiani Anhwiaso Bekwai" },
        { "name": "Sefwi Bekwai Senior High", "type": "Senior High School", "district": "Bibiani Anhwiaso Bekwai" }
    ]
};

const SEED_MATCHES = [
    {
        id: "final-2025",
        participants: [
            { schoolId: "mfantsipim-school", name: "Mfantsipim School", odd: 1.85 },
            { schoolId: "st-augustines-college", name: "St. Augustine's College", odd: 2.15 },
            { schoolId: "opoku-ware-school", name: "Opoku Ware School", odd: 4.50 }
        ],
        startTime: "Ended",
        isLive: false,
        stage: "National Grand Finale",
        odds: { schoolA: 1.85, schoolB: 2.15, schoolC: 4.50 }, // Keeping for backwards compat if needed, or just metadata
        extendedOdds: {
            winningMargin: { "1-10": 2.10, "11-25": 3.40, "26+": 6.00 },
            highestScoringRound: { "Round 1": 4.00, "Round 2": 3.50, "Round 3": 5.00, "Round 4": 6.50, "Round 5": 2.80 },
            round1Winner: { "Mfantsipim": 1.70, "St. Augustine's": 2.30, "Opoku Ware": 3.50 },
            totalPoints: { "Over 120.5": 1.85, "Under 120.5": 1.95 }
        }
    },
    {
        id: "semi-1",
        participants: [
            { schoolId: "mfantsipim-school", name: "Mfantsipim School", odd: 1.45 },
            { schoolId: "gsts", name: "GSTS", odd: 3.50 },
            { schoolId: "mankranso-shs", name: "Mankranso SHS", odd: 6.00 }
        ],
        startTime: "Ended",
        isLive: false,
        stage: "Semi-Final Contest 1",
        odds: { schoolA: 1.45, schoolB: 3.50, schoolC: 6.00 },
        extendedOdds: {
            winningMargin: { "1-10": 1.90, "11-25": 2.80, "26+": 4.50 },
            problemOfTheDayScore: { "Perfect 10": 4.50, "7-9 pts": 2.10, "4-6 pts": 1.80, "0-3 pts": 3.50 },
            leadingAfterRound3: { "Mfantsipim": 1.20, "GSTS": 4.00, "Mankranso": 8.00 }
        }
    },
    {
        id: "semi-2",
        participants: [
            { schoolId: "st-augustines-college", name: "St. Augustine's College", odd: 1.65 },
            { schoolId: "pope-john-shs", name: "Pope John SHS", odd: 2.40 },
            { schoolId: "amaniampong-shs", name: "Amaniampong SHS", odd: 5.50 }
        ],
        startTime: "Ended",
        isLive: false,
        stage: "Semi-Final Contest 2",
        odds: { schoolA: 1.65, schoolB: 2.40, schoolC: 5.50 },
        extendedOdds: {
            winningMargin: { "1-10": 2.00, "11-25": 3.10, "26+": 5.00 },
            highestScoringRound: { "Round 1": 4.10, "Round 2": 3.40, "Round 3": 4.80, "Round 4": 6.20, "Round 5": 2.90 },
            bothToScoreOver40: { "Yes": 5.00, "No": 1.15 }
        }
    },
    {
        id: "semi-3",
        participants: [
            { schoolId: "opoku-ware-school", name: "Opoku Ware School", odd: 1.50 },
            { schoolId: "achimota-school", name: "Achimota School", odd: 2.80 },
            { schoolId: "st-peters-shs", name: "St. Peter's SHS", odd: 5.20 }
        ],
        startTime: "Ended",
        isLive: false,
        stage: "Semi-Final Contest 3",
        odds: { schoolA: 1.50, schoolB: 2.80, schoolC: 5.20 },
        extendedOdds: {
            round5SpeedRaceWinner: { "Opoku Ware": 1.55, "Achimota": 2.60, "St. Peter's": 3.80 },
            totalTrueFalseCorrect: { "Over 12.5": 1.90, "Under 12.5": 1.90 }
        }
    },
    {
        id: "reg-live-1",
        participants: [
            { schoolId: "prempeh-college", name: "Prempeh College", odd: 1.25 },
            { schoolId: "kumasi-high-school", name: "Kumasi High School", odd: 4.10 },
            { schoolId: "ksts", name: "K.S.T.S.", odd: 8.00 }
        ],
        startTime: "Live Now",
        isLive: true,
        stage: "Regional Qualifiers",
        odds: { schoolA: 1.25, schoolB: 4.10, schoolC: 8.00 },
        extendedOdds: {
            nextToAnswerCorrectly: { "Prempeh": 1.40, "Kumasi High": 3.50, "KSTS": 6.00 },
            currentRoundWinner: { "Prempeh": 1.15, "Kumasi High": 5.00, "KSTS": 10.00 }
        }
    },
    {
        id: "reg-live-2",
        participants: [
            { schoolId: "presec-legon", name: "PRESEC Legon", odd: 1.35 },
            { schoolId: "accra-academy", name: "Accra Academy", odd: 3.20 },
            { schoolId: "chemu-shs", name: "Chemu SHS", odd: 6.50 }
        ],
        startTime: "Live Now",
        isLive: true,
        stage: "Regional Qualifiers",
        odds: { schoolA: 1.35, schoolB: 3.20, schoolC: 6.50 },
        extendedOdds: {
            winningMargin: { "1-10": 2.05, "11-25": 2.60, "26+": 4.00 },
            highestScoringRound: { "Round 1": 3.95, "Round 2": 3.10, "Round 3": 4.90, "Round 4": 6.30, "Round 5": 2.55 }
        }
    }
];

async function main() {
    console.log("🌱 Seeding database...");

    try {
        console.log("🏫 Seeding schools...");
        // Ensure connection verify
        await db.select().from(schools).limit(1);

        for (const [region, schoolList] of Object.entries(SEED_SCHOOL_DATA)) {
            for (const school of schoolList) {
                const schoolId = school.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                await db.insert(schools).values({
                    id: schoolId,
                    name: school.name,
                    region: region,
                    district: school.district,
                    category: school.type,
                }).onConflictDoUpdate({
                    target: schools.id,
                    set: {
                        name: school.name,
                        region: region,
                        district: school.district,
                        category: school.type,
                    }
                });
            }
        }

        console.log("🎮 Seeding matches...");
        for (const match of SEED_MATCHES) {
            console.log(`Inserting match: ${match.id}`);
            await db.insert(matches).values({
                id: match.id,
                participants: match.participants, // Using new structure
                startTime: match.startTime,
                isLive: match.isLive,
                stage: match.stage,
                odds: match.odds,
                extendedOdds: match.extendedOdds,
                isVirtual: false,
                sportType: "quiz",
                gender: "mixed",
                margin: { profit: 0.1 }
            }).onConflictDoUpdate({
                target: matches.id,
                set: {
                    participants: match.participants,
                    startTime: match.startTime,
                    isLive: match.isLive,
                    stage: match.stage,
                    odds: match.odds,
                    extendedOdds: match.extendedOdds,
                }
            });
        }
        console.log("✅ Seeding complete!");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
    process.exit(0);
}

main();
