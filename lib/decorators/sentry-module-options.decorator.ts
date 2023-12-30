import { createInjectableDecorator } from '../utils';
import { SENTRY_MODULE_OPTIONS } from '../sentry.tokens';

export const InjectSentryModuleOptions = createInjectableDecorator(SENTRY_MODULE_OPTIONS);
