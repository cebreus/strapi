import type { Schema, Struct } from '@strapi/strapi';

export interface ComponentsFaqItems extends Struct.ComponentSchema {
  collectionName: 'components_components_faq_items';
  info: {
    description: '';
    displayName: 'FAQs';
  };
  attributes: {
    answer: Schema.Attribute.Blocks;
    category: Schema.Attribute.Enumeration<
      ['Elektronick\u00E9 \u010Dasov\u00E9 j\u00EDzdn\u00E9', 'eShop']
    >;
    question: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface MetadataSeo extends Struct.ComponentSchema {
  collectionName: 'components_metadata_seos';
  info: {
    description: '';
    displayName: 'SEO';
    icon: 'globe';
  };
  attributes: {
    description: Schema.Attribute.String;
    robots: Schema.Attribute.Enumeration<
      ['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow']
    > &
      Schema.Attribute.DefaultTo<'index,follow'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'components.faq-items': ComponentsFaqItems;
      'metadata.seo': MetadataSeo;
    }
  }
}
