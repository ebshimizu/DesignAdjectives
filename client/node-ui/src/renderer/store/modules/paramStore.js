import { createStore } from '../backend/parameter-store';
import { CompositorBackend } from '../backend/compositor';

// the default parameter store is the compositor backend
const paramStore = createStore(CompositorBackend, 'compositor');

export default paramStore;
