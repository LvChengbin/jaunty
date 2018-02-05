import escapeReg from '@lvchengbin/escape/src/regexp';

export const leftDelimiter = '{{';
export const rightDelimiter = '}}';
export const leftDelimiterReg = escapeReg( leftDelimiter );
export const rightDelimiterReg = escapeReg( rightDelimiter );
