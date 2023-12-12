/**
 * Copyright (c) 2021-present, Fonoster, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Introduction',
      items: [
        'overview',
        'community',
        'support'
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Getting started',
      items: [
        'getting_started/overview',
        'getting_started/create_an_user_account',
        'getting_started/make_a_hello_world',
        'getting_started/install_and_setup_the_cli',
        'getting_started/create_a_project',
        'getting_started/create_a_voice_application',
        'getting_started/configure_a_number',
        'getting_started/receive_and_respond_to_a_call',
        'getting_started/make_an_outbound_call',
        'getting_started/troubleshooting',
        'getting_started/feedback',
        {
          type: 'category',
          label: 'Reference',
          items: [
            'reference/overview',
            'reference/VoiceResponse',
            'reference/Users',
            'reference/Projects',
            'reference/Providers',
            'reference/Numbers',
            'reference/Domains',
            'reference/Agents',
            'reference/CallManager',
            'reference/Auths'
          ],
          collapsed: true,
        },
      ],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Tutorials',
      items: [
        'tutorials/using_google_speech',
        'tutorials/connecting_with_dialogflow',
        'tutorials/using_the_javascript_sdks'
      ],
      collapsed: true,
    }
  ]
}
