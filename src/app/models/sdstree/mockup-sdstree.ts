import { Sdstree} from './sdstree';
import { valuesMatrix, valuesVect} from './SDSMatrix';

export const Tuto: Sdstree = {
  name: 'ExempleBase' ,
  comment: 'Dico example with matrix , cube and hypercube',
  history : {
		'tool': 'SDSGui',
		'user': 'X123456',
		'date': ''
	},
  groups : [
    {name: 'CtesUniv' , comment: 'Group Universal constants',
     matrices : [
      {name : 'g', comment : 'gravity acceleration',
        type : 'float' , unit : 'm*(s**-2)', values : 9.80665 },
      {name : 'Na', comment : 'Avogadro number',
        type : 'float' , unit : 'mol**-1', values : 6.02214e+23 }
      ]
    },
    {name: 'Vect0' , comment: ' Group Vector with values in the sds root file',
     matrices : [
      {name : 'Mach', comment : 'Mach',
        type : 'float' , unit : '',
        dimensions : [{size : 4}],
        values : [0.3, 0.4, 0.5, 0.6] },
      {name : 'Altitude', comment : 'altitude',
        type : 'float' , unit : 'x100 feet',
        dimensions : [{size : 6}],
        values : [190, 210, 230, 250, 270, 290 ] }
      ]
    },
    {name: 'VectF' , comment: 'Group Vector with values in others files',
     matrices : [
      {name : 'MachF', comment : 'Mach',
        type : 'float' , unit : '',
        dimensions : [{size : 4}],
        values : [1.1, 1.2, 2.3, 3.4] },
      {name : 'AltitudeF', comment : 'altitude',
        type : 'float' , unit : 'x100 feet',
        dimensions : [{size : 6}],
        values : [1190, 1210, 1230, 1250, 1270, 1290] }
      ]
    },
    {name: 'Mat0' , comment: 'Group Matrix Examples',
     matrices : [
      {name : 'MatrixS', comment : 'Small Matrix with direct values',
        type : 'float' , unit : '',
        dimensions : [{size : 2}, {size : 2}],
        values : [[7.0, 1.7] , [3.7, 4.7]] },
       {name : 'MatrixF',
         comment : 'Average Matrix with scales and values in files',
         type : 'float' , unit : '',
         dimensions : [
           {size : 4, scale: '/VectF/MachF'},
           {size : 6, scale: '/VectF/AltitudeF'}],
         values : [[1.1, 1.2, 1.3, 1.4],
                   [2.1, 2.2, 2.3, 2.4],
                   [3.1, 3.2, 3.3, 3.4],
                   [4.1, 4.2, 4.3, 4.4],
                   [5.1, 5.2, 5.3, 5.4],
                   [6.1, 6.2, 6.3, 6.4]]
       },
       {name : 'MatrixL',
         comment : 'Average Matrix with values in file',
         type : 'float' , unit : '',
         dimensions : [
           {size : 4, scale: '/Vect0/Mach'},
           {size : 6, scale: '/Vect0/Altitude'}],
         values : [[1.1, 2.1, 3.1, 4.1],
                   [1.2, 2.2, 3.2, 4.2],
                   [1.3, 2.3, 3.3, 4.3],
                   [1.4, 2.4, 3.4, 4.4],
                   [1.5, 2.5, 3.5, 4.5],
                   [1.6, 2.6, 3.6, 4.6]]
        }
      ]
    },
    {name: 'Cube0' , comment: 'Group Cube Examples',
     matrices : [
      {name : 'CubeS', comment : 'Small Cube with direct values',
        type : 'float' , unit : '',
        dimensions : [{size : 2}, {size : 2}, {size : 2}],
        values : [[[1.11, 1.12], [1.21, 1.22]],
                  [[2.11, 2.12], [2.21, 2.22]]]
      }]
    },
    {name: 'HypCube0' , comment: 'Group Hyper Cube Examples',
     matrices : [
      {name : 'HypCubeS', comment : 'Small Hyper Cube with direct values',
        type : 'float' , unit : '',
        dimensions : [{size : 2}, {size : 2}, {size : 2}, {size : 2}],
        values : [[[[1.111, 1.112], [1.121, 1.122]],
                   [[1.211, 1.212], [1.221, 1.222]]],
                  [[[2.111, 2.112], [2.121, 2.122]],
                   [[2.211, 2.212], [2.221, 2.222]]]]
      }]
    },
    {name: 'Mat1' , comment: 'Group Matrix with variant Examples',
     matrices : [
      {name : 'MatrixS', comment : 'Small Matrix with direct values',
        type : 'float' , unit : '',
        dimensions : [{size : 2}, {size : 2}],
        variants : [{name: '/Mat0/MatrixS', comment: 'alternate'},
          {name: '/Mat1/MatrixSB', comment: 'backup'}] ,
        values : [[6.0, 0.7], [2.7, 3.7]] },
      {name : 'MatrixSB', comment : 'Another Small Matrix with direct values',
        type : 'float' , unit : '',
        dimensions : [{size : 2}, {size : 2}],
        variants : [{name: '/Mat0/MatrixS', comment: 'alternate'},
          {name: '/Mat1/MatrixS', comment: 'backup'}] ,
        values : [[8.0, 2.7], [4.7, 5.7]] },
      ]
    }
    ]
};

export const VectF_MachF_json : valuesVect = [0.1, 0.2, 0.3, 0.4];
export const VectF_AltitudeF_json : valuesVect = [190, 210, 230, 250, 270, 290 ];
// Mat0_MatrixF_json
// 6 array of 4 items
// Mat0_MatrixF_json[j] for j from 0 to 5
export const Mat0_MatrixF_json : valuesMatrix = [
  [1.1, 1.2, 1.3, 1.4],
  [2.1, 2.2, 2.3, 2.4],
  [3.1, 3.2, 3.3, 3.4],
  [4.1, 4.2, 4.3, 4.4],
  [5.1, 5.2, 5.3, 5.4],
  [6.1, 6.2, 6.3, 6.4],
  ];
// Mat0_MatrixL_json
// Mat(i,j)=Mat0_MatrixL_json[j][i]
export const Mat0_MatrixL_json : valuesMatrix = [
  [1.1, 2.1, 3.1, 4.1],
  [1.2, 2.2, 3.2, 4.2],
  [1.3, 2.3, 3.3, 4.3],
  [1.4, 2.4, 3.4, 4.4],
  [1.5, 2.5, 3.5, 4.5],
  [1.6, 2.6, 3.6, 4.6],
  ];
// Mathematical Algebra representation
// 1.1000    1.2000    1.3000    1.4000    1.5000    1.6000
// 2.1000    2.2000    2.3000    2.4000    2.5000    2.6000
// 3.1000    3.2000    3.3000    3.4000    3.5000    3.6000
// 4.1000    4.2000    4.3000    4.4000    4.5000    4.6000
