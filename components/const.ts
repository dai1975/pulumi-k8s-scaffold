import * as path from 'path';

export const component_name = (module:string, type:string):string => {
    return `dai1975:${module}:${type}`;
};

export const CHARTDIR = path.join( __dirname, '../submodules');
export const chart_dir = (...subdirs:string[]):string => {
    return path.join(CHARTDIR, ...subdirs);
};
