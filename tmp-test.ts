import { BEST_27_SCHOOLS, DEFAULT_SCHOOLS } from './lib/virtuals';

const defaultNames = DEFAULT_SCHOOLS.map(s => s.name);
const missing = BEST_27_SCHOOLS.filter(s => !defaultNames.includes(s));

console.log("Missing schools:", missing);
