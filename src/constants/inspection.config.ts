
import type { InspectionData, InspectionCategoryState, InspectionCategoryConfig, StatusOption, ExtinguisherTypeOption, ExtinguisherWeightOption } from '@/lib/types';

export const EXTINGUISHER_TYPES: ExtinguisherTypeOption[] = ['AP', 'ABC', 'BC', 'EPM', 'CO²'];
export const EXTINGUISHER_WEIGHTS: ExtinguisherWeightOption[] = ['4kg', '6kg', '8kg', '10kg', '12kg', '20kg', '50kg', '75kg'];


export const INSPECTION_CONFIG: InspectionCategoryConfig[] = [
  {
    id: 'extintor',
    title: 'Extintor',
    type: 'standard',
    subItems: [
      { id: 'extintor_lacre_manometro_mangueira_anel', name: 'Lacre/Manômetro/Mangueira/Anel' },
      { id: 'extintor_pressao', name: 'Pressão' },
      { id: 'extintor_fixacao', name: 'Fixação' },
      { id: 'extintor_pintura_solo', name: 'Pintura De Solo' },
      { id: 'extintor_obstrucao_protecao_intemperies', name: 'Obstr/ Proteção Int.' },
      { id: 'extintor_teste_hidrostatico', name: 'Teste Hidrostático' },
      { id: 'extintor_cadastro', name: 'Cadastro de Extintores', isRegistry: true },
    ],
  },
  {
    id: 'porta_corta_fogo',
    title: 'Porta Corta Fogo',
    type: 'standard',
    subItems: [
      { id: 'pcf_macaneta', name: 'Maçaneta' },
      { id: 'pcf_molas', name: 'Molas' },
      { id: 'pcf_conforme_projeto', name: 'Conforme Projeto' },
      { id: 'pcf_funcionamento', name: 'Funcionamento' },
    ],
  },
  {
    id: 'alarme',
    title: 'Alarme',
    type: 'standard',
    subItems: [
      { id: 'alarme_painel', name: 'Painel' },
      { id: 'alarme_botoeiras', name: 'Botoeiras' },
      { id: 'alarme_detector_fumaca', name: 'Detector De Fumaça' },
      { id: 'alarme_pressurizacao', name: 'Pressurização' },
      { id: 'alarme_funcionamento', name: 'Funcionamento' },
    ],
  },
  {
    id: 'iluminacao',
    title: 'Iluminação',
    type: 'standard',
    subItems: [
      { id: 'iluminacao_disjuntor_independente', name: 'Disjuntor Independente' },
      { id: 'iluminacao_bem_fixada', name: 'Bem Fixada' },
      { id: 'iluminacao_conforme_projeto', name: 'Conforme Projeto' },
      { id: 'iluminacao_funcionamento', name: 'Funcionamento' },
    ],
  },
  {
    id: 'hidrantes',
    title: 'Hidrantes',
    type: 'standard',
    subItems: [
      { id: 'hidrantes_chaves', name: 'Chaves' },
      { id: 'hidrantes_esguichos', name: 'Esguichos' },
      { id: 'hidrantes_caixa_abrigo', name: 'Caixa Abrigo' },
      { id: 'hidrantes_sinalizacao_solo', name: 'Sinalização De Solo' },
      { id: 'hidrantes_placa_sinalizacao', name: 'Placa De Sinalização' },
      { id: 'hidrantes_vazamento', name: 'Vazamento' },
      { id: 'hidrantes_teste_hidrostatico', name: 'Teste Hidrostático' },
    ],
  },
  { id: 'bomba_principal_spk', title: 'Bomba Principal SPK', type: 'special' },
  { id: 'bomba_jockey_spk', title: 'Bomba Jockey SPK', type: 'special' },
  { id: 'bomba_principal_hidrante', title: 'Bomba Principal Hidrante', type: 'special' },
  { id: 'bomba_jockey_hidrante', title: 'Bomba Jockey Hidrante', type: 'special' },
  { id: 'pressao_spk', title: 'Pressão SPK', type: 'pressure' },
  { id: 'pressao_hidrante', title: 'Pressão Hidrante', type: 'pressure' },
];

export const STATUS_OPTIONS: StatusOption[] = ['OK', 'N/C', 'N/A'];
export const PRESSURE_UNITS: InspectionCategoryState['pressureUnit'][] = ['Kg', 'PSI', 'Bar'];

export const INITIAL_INSPECTION_DATA: Omit<InspectionData, 'id' | 'timestamp'> = {
  clientLocation: '',
  clientCode: '',
  floor: '',
  inspectionNumber: '',
  inspectionDate: new Date().toISOString().split('T')[0],
  categories: INSPECTION_CONFIG.map(category => ({
    id: category.id,
    title: category.title,
    type: category.type,
    isExpanded: false,
    ...(category.type === 'standard' && {
      subItems: category.subItems!.map(subItem => ({
        id: subItem.id,
        name: subItem.name,
        status: undefined,
        observation: '',
        showObservation: false,
        isRegistry: subItem.isRegistry || false,
        ...(subItem.isRegistry && { registeredExtinguishers: [] }),
      })),
    }),
    ...(category.type === 'special' && {
      status: undefined,
      observation: '',
      showObservation: false,
    }),
    ...(category.type === 'pressure' && {
      pressureValue: '',
      pressureUnit: '' as InspectionCategoryState['pressureUnit'],
      observation: '',
      showObservation: false,
    }),
  })),
};
