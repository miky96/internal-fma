export interface Product {
  id: string;
  name: string;
  quantity: number;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export const Makro = [
  'Pa bimbo',
  'Formatge',
  'Pernil dolç',
];
export const Alcohol = [
  'Barril cervesa',
  'Ginebra Beefeater',
  'Ron Negrita',
  'Whiskey Ballantines',
  'Vodka Smirnoff',
  'Baileys',
  'Licor herbes',
  "Licor d'arròs",
  'Ratafia',
  'Patxaran Etxeco',
  'Moscatell',
  'Vi blanc',
  'Vi negre',
  'Vermut',
];

export const OtherProducts = [
  'Freedam',
  'CCola 2L',
  'Daura',
  'Fanta taronja 2L',
  'Fanta llimona 2L',
  'Limon Nada',
  'Suc taronja',
  'Suc pressec',
  'Suc pinya',
  'Schweepes 1L',
];

export const ProductNames = [
  ...Makro, ...Alcohol, ...OtherProducts,
];
