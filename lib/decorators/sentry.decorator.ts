import { createInjectableDecorator } from '../utils';
import { SENTRY_TOKEN } from '../sentry.tokens';

export const InjectSentry = createInjectableDecorator(SENTRY_TOKEN);
