import type { InspectionData, InspectionCategoryState, InspectionCategoryConfig, HoseEntry, ExtinguisherEntry, StatusOption } from '@/lib/types';

export const INSPECTION_CONFIG: InspectionCategoryConfig[] = [
  {
    id: 'extintor',
    title: 'Extintor',
    type: 'standard',
    subItems: [
      { id: 'lacre_manometro_mangueira_anel', name: 'Lacre/Manômetro/Mangueira/Anel' },
      { id: 'pressao_extintor', name: 'Pressão' },
      { id: 'fixacao_extintor', name: 'Fixação' },
      { id: 'pintura_solo_extintor', name: 'Pintura De Solo' },
      { id: 'obstrucao_protecao_intemperies', name: 'Obstr/ Proteção Int.' },
      { id: 'teste_hidrostatico_extintor', name: 'Teste Hidrostático' },
    ],
  },
  {
    id: 'porta_corta_fogo',
    title: 'Porta Corta Fogo',
    type: 'standard',
    subItems: [
      { id: 'macaneta_pcf', name: 'Maçaneta' },
      { id: 'molas_pcf', name: 'Molas' },
      { id: 'conforme_projeto_pcf', name: 'Conforme Projeto' },
      { id: 'funcionamento_pcf', name: 'Funcionamento' },
    ],
  },
  {
    id: 'alarme',
    title: 'Alarme',
    type: 'standard',
    subItems: [
      { id: 'painel_alarme', name: 'Painel' },
      { id: 'botoeiras_alarme', name: 'Botoeiras' },
      { id: 'detector_fumaca_alarme', name: 'Detector De Fumaça' },
      { id: 'pressurizacao_alarme', name: 'Pressurização' },
      { id: 'funcionamento_alarme', name: 'Funcionamento' },
    ],
  },
  {
    id: 'iluminacao',
    title: 'Iluminação',
    type: 'standard',
    subItems: [
      { id: 'disjuntor_independente_iluminacao', name: 'Disjuntor Independente' },
      { id: 'bem_fixada_iluminacao', name: 'Bem Fixada' },
      { id: 'conforme_projeto_iluminacao', name: 'Conforme Projeto' },
      { id: 'funcionamento_iluminacao', name: 'Funcionamento' },
    ],
  },
  {
    id: 'hidrantes',
    title: 'Hidrantes',
    type: 'standard',
    subItems: [
      { id: 'chaves_hidrante', name: 'Chaves' },
      { id: 'esguichos_hidrante', name: 'Esguichos' },
      { id: 'caixa_abrigo_hidrante', name: 'Caixa Abrigo' },
      { id: 'sinalizacao_solo_hidrante', name: 'Sinalização De Solo' },
      { id: 'placa_sinalizacao_hidrante', name: 'Placa De Sinalização' },
      { id: 'vazamento_hidrante', name: 'Vazamento' },
      { id: 'teste_hidrostatico_hidrante', name: 'Teste Hidrostático' },
    ],
  },
  { id: 'bomba_principal_spk', title: 'Bomba Principal SPK', type: 'special' },
  { id: 'bomba_jockey_spk', title: 'Bomba Jockey SPK', type: 'special' },
  { id: 'bomba_principal_hidrante', title: 'Bomba Principal Hidrante', type: 'special' },
  { id: 'bomba_jockey_hidrante', title: 'Bomba Jockey Hidrante', type: 'special' },
  { id: 'pressao_spk', title: 'Pressão SPK', type: 'pressure' },
  { id: 'pressao_hidrante', title: 'Pressão Hidrante', type: 'pressure' },
];

export const HOSE_LENGTH_OPTIONS: HoseEntry['length'][] = ['15 metros', '20 metros', '30 metros'];
export const HOSE_DIAMETER_OPTIONS: HoseEntry['diameter'][] = ['1½"', '2½"'];
export const HOSE_TYPE_OPTIONS: HoseEntry['type'][] = ['Tipo 1', 'Tipo 2', 'Tipo 3', 'Tipo 4', 'Tipo 5', 'Tipo 6'];

export const EXTINGUISHER_TYPE_OPTIONS: ExtinguisherEntry['type'][] = ['AP', 'ABC', 'BC', 'EPM', 'CO²'];
export const EXTINGUISHER_WEIGHT_OPTIONS: ExtinguisherEntry['weight'][] = ['4kg', '6kg', '8kg', '10kg', '12kg', '20kg', '50kg', '75kg'];

export const STATUS_OPTIONS: StatusOption[] = ['OK', 'N/C', 'N/A', ''];
export const PRESSURE_UNITS: InspectionCategoryState['pressureUnit'][] = ['Kg', 'PSI', 'Bar', ''];

export const INITIAL_INSPECTION_DATA: Omit<InspectionData, 'id' | 'timestamp'> = {
  clientLocation: '',
  clientCode: '',
  floor: '',
  inspectionNumber: '',
  categories: INSPECTION_CONFIG.map(category => ({
    ...category,
    isExpanded: true,
    ...(category.type === 'standard' && {
      subItems: category.subItems!.map(subItem => ({
        ...subItem,
        status: '', // Initial status is empty string
        observation: '',
        showObservation: false,
      })),
    }),
    ...(category.type === 'special' && {
      status: '', // Initial status is empty string
      observation: '',
      showObservation: false,
    }),
    ...(category.type === 'pressure' && {
      pressureValue: '',
      pressureUnit: '',
    }),
  })),
  hoses: [],
  extinguishers: [],
};
