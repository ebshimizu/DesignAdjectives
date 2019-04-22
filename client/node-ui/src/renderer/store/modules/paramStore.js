import { createStore } from '../backend/parameter-store';
// import { Backend } from '../backend/compositor';
import Backend from '../backend/substance';

// the default parameter store is the compositor backend
// const paramStore = createStore(Backend, 'compositor');
const paramStore = createStore(Backend, 'substance');

export default paramStore;
