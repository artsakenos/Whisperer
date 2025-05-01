/**
 * If you choose to override some of the default configuration, you can do so here.
 * This file is a template and should be copied to config/config_user.js
 * and modified there.
 *
 * Please note that the parent / main node of a nested path will be overridden in the get.
 * For example, if you call config_get('providers'), the entire 'providers' tree
 * will be replaced by this one.
 */
window.config_user = {
    providers: {
        deepseek: {
            api_key: "dsk_..."
        }
    }
}