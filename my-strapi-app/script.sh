#!/bin/bash

# NULP Strapi Collections Creation Script
# This script creates all 10 collections and components for the NULP Strapi CMS

set -e

echo "🚀 Creating NULP Strapi Collections and Components..."
echo "=============================================="

# Create base directories
echo "📁 Creating directory structure..."

# Collections
mkdir -p src/api/category/content-types/category
mkdir -p src/api/media-asset/content-types/media-asset
mkdir -p src/api/article/content-types/article
mkdir -p src/api/menu/content-types/menu
mkdir -p src/api/banner/content-types/banner
mkdir -p src/api/testimonial/content-types/testimonial
mkdir -p src/api/partner/content-types/partner
mkdir -p src/api/contact-us/content-types/contact-us
mkdir -p src/api/social-media/content-types/social-media
mkdir -p src/api/content-search-config/content-types/content-search-config

# Components
mkdir -p src/components/common
mkdir -p src/components/sunbird

echo "✅ Directory structure created"

# Create Components First
echo "🔧 Creating reusable components..."

# 1. Meta Tag Component
cat > src/components/common/meta-tag.json << 'EOF'
{
  "collectionName": "components_common_meta_tags",
  "info": {
    "displayName": "Meta Tag",
    "description": "Reusable meta tag component for tagging content"
  },
  "options": {},
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "value": {
      "type": "string",
      "required": false
    }
  }
}
EOF

# 2. Sunbird DO ID Component
cat > src/components/sunbird/sunbird-doid.json << 'EOF'
{
  "collectionName": "components_sunbird_sunbird_doids",
  "info": {
    "displayName": "Sunbird DO ID",
    "description": "Component for storing Sunbird Digital Object Identifiers"
  },
  "options": {},
  "attributes": {
    "do_id": {
      "type": "string",
      "required": true
    }
  }
}
EOF

echo "✅ Components created"

# Create Collection Schemas
echo "📦 Creating collection schemas..."

# 1. Category Collection
cat > src/api/category/content-types/category/schema.json << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "categories",
  "info": {
    "singularName": "category",
    "pluralName": "categories",
    "displayName": "Category",
    "description": "Category management with hierarchical structure"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "slug": {
      "type": "string",
      "required": true,
      "unique": true,
      "regex": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "name": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text",
      "required": false
    },
    "state": {
      "type": "enumeration",
      "enum": ["unpublished", "published"],
      "default": "unpublished",
      "required": true
    },
    "parent": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category"
    },
    "children": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::category.category",
      "mappedBy": "parent"
    }
  }
}
EOF

# 2. Media Asset Collection
cat > src/api/media-asset/content-types/media-asset/schema.json << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "media_assets",
  "info": {
    "singularName": "media-asset",
    "pluralName": "media-assets",
    "displayName": "Media Asset",
    "description": "Media management for images and videos with categorization and metadata"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "string",
      "required": true,
      "unique": true,
      "regex": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "uid": {
      "type": "uid",
      "targetField": "title",
      "required": true
    },
    "type": {
      "type": "enumeration",
      "enum": ["Image", "Video"],
      "required": true
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "image_file": {
      "type": "media",
      "allowedTypes": ["images"],
      "multiple": false
    },
    "video_source": {
      "type": "enumeration",
      "enum": ["Direct Upload", "YouTube"]
    },
    "video_file": {
      "type": "media",
      "allowedTypes": ["videos"],
      "multiple": false
    },
    "youtube_url": {
      "type": "string"
    },
    "thumbnail": {
      "type": "media",
      "allowedTypes": ["images"],
      "multiple": false
    },
    "tags": {
      "type": "component",
      "repeatable": true,
      "component": "common.meta-tag"
    },
    "display_start_date": {
      "type": "datetime"
    },
    "display_end_date": {
      "type": "datetime"
    },
    "status": {
      "type": "enumeration",
      "enum": ["unpublished", "published", "archived"],
      "default": "unpublished"
    },
    "created_by": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "is_deleted": {
      "type": "boolean",
      "default": false
    }
  }
}
EOF

# 3. Article Collection
cat > src/api/article/content-types/article/schema.json << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article",
    "description": "Article management with WYSIWYG content editor, categorization and publishing workflow"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "uid": {
      "type": "uid",
      "targetField": "name",
      "required": true
    },
    "name": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "string",
      "required": true,
      "unique": true,
      "regex": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "content": {
      "type": "richtext",
      "required": true
    },
    "state": {
      "type": "enumeration",
      "enum": ["unpublished", "published", "archived"],
      "required": true,
      "default": "unpublished"
    },
    "start_publish_date": {
      "type": "datetime"
    },
    "end_publish_date": {
      "type": "datetime"
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "required": true
    },
    "thumbnail": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "api::media-asset.media-asset",
      "required": true
    },
    "created_by": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "is_deleted": {
      "type": "boolean",
      "default": false
    },
    "tags": {
      "type": "component",
      "repeatable": true,
      "component": "common.meta-tag"
    }
  }
}
EOF

# 4. Menu Collection
cat > src/api/menu/content-types/menu/schema.json << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "menus",
  "info": {
    "singularName": "menu",
    "pluralName": "menus",
    "displayName": "Menu",
    "description": "Manage site menus with hierarchical structure and flexible navigation"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "uid": {
      "type": "uid",
      "targetField": "title",
      "required": true,
      "unique": true
    },
    "title": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "string",
      "required": true,
      "unique": true,
      "regex": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "menu_type": {
      "type": "enumeration",
      "enum": ["Internal", "External"],
      "required": true
    },
    "link": {
      "type": "string",
      "required": true
    },
    "target_window": {
      "type": "enumeration",
      "enum": ["parent", "new_window"],
      "required": true,
      "default": "parent"
    },
    "category": {
      "type": "enumeration",
      "enum": ["Main Menu", "Footer Menu", "Sidebar Menu"],
      "required": true
    },
    "parent_menu": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::menu.menu"
    },
    "child_menus": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::menu.menu",
      "mappedBy": "parent_menu"
    },
    "state": {
      "type": "enumeration",
      "enum": ["unpublished", "published", "archived"],
      "required": true,
      "default": "unpublished"
    },
    "start_publish_date": {
      "type": "datetime"
    },
    "end_publish_date": {
      "type": "datetime"
    },
    "link_image": {
      "type": "media",
      "allowedTypes": ["images"],
      "multiple": false
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "required": true
    },
    "display_order": {
      "type": "integer"
    },
    "created_by": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    }
  }
}
EOF

# 5. Banner Collection
cat > src/api/banner/content-types/banner/schema.json << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "banners",
  "info": {
    "singularName": "banner",
    "pluralName": "banners",
    "displayName": "Banner",
    "description": "Site banner management with rich content and media integration"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "uid": {
      "type": "uid",
      "targetField": "name",
      "required": true,
      "unique": true
    },
    "name": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "string",
      "required": true,
      "unique": true,
      "regex": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "content": {
      "type": "richtext",
      "required": true
    },
    "state": {
      "type": "enumeration",
      "enum": ["unpublished", "published", "archived"],
      "required": true,
      "default": "unpublished"
    },
    "start_publish_date": {
      "type": "datetime"
    },
    "end_publish_date": {
      "type": "datetime"
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "required": true
    },
    "background_image": {
      "type": "media",
      "allowedTypes": ["images"],
      "multiple": false,
      "required": true
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "required": true
    },
    "display_order": {
      "type": "integer"
    },
    "created_by": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    }
  }
}
EOF

# 6. Testimonial Collection
cat > src/api/testimonial/content-types/testimonial/schema.json << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "testimonials",
  "info": {
    "singularName": "testimonial",
    "pluralName": "testimonials",
    "displayName": "Testimonial",
    "description": "User testimonials with rich content and category-based organization"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "uid": {
      "type": "uid",
      "targetField": "user_name",
      "required": true,
      "unique": true
    },
    "user_name": {
      "type": "string",
      "required": true
    },
    "user_details": {
      "type": "string",
      "required": true
    },
    "testimonial": {
      "type": "richtext",
      "required": true
    },
    "state": {
      "type": "enumeration",
      "enum": ["unpublished", "published", "archived"],
      "required": true,
      "default": "unpublished"
    },
    "start_publish_date": {
      "type": "datetime"
    },
    "end_publish_date": {
      "type": "datetime"
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "required": true
    },
    "thumbnail": {
      "type": "media",
      "allowedTypes": ["images"],
      "multiple": false,
      "required": true
    },
    "created_by": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "required": true
    }
  }
}
EOF

# 7. Partner Collection
cat > src/api/partner/content-types/partner/schema.json << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "partners",
  "info": {
    "singularName": "partner",
    "pluralName": "partners",
    "displayName": "Partner",
    "description": "Business partners and organizational alliances"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "uid": {
      "type": "uid",
      "targetField": "name",
      "required": true,
      "unique": true
    },
    "name": {
      "type": "string",
      "required": true
    },
    "logo": {
      "type": "media",
      "allowedTypes": ["images"],
      "multiple": false,
      "required": true
    },
    "link": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "string",
      "required": true,
      "unique": true,
      "regex": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "category": {
      "type": "enumeration",
      "enum": [
        "technology",
        "education",
        "finance",
        "nonprofit",
        "government",
        "healthcare"
      ],
      "required": true
    },
    "state": {
      "type": "enumeration",
      "enum": ["unpublished", "published"],
      "required": true,
      "default": "unpublished"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "required": true
    },
    "display_order": {
      "type": "integer"
    },
    "created_by": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    }
  }
}
EOF

# 8. Contact Us Collection
cat > src/api/contact-us/content-types/contact-us/schema.json << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "contact_us",
  "info": {
    "singularName": "contact-us",
    "pluralName": "contact-us-entries",
    "displayName": "Contact Us",
    "description": "Contact information and office locations with rich address formatting"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "uid": {
      "type": "uid",
      "targetField": "title",
      "required": true,
      "unique": true
    },
    "title": {
      "type": "string",
      "required": true
    },
    "logo": {
      "type": "media",
      "allowedTypes": ["images"],
      "multiple": false,
      "required": true
    },
    "category": {
      "type": "enumeration",
      "enum": [
        "corporate",
        "branch", 
        "support",
        "regional"
      ],
      "required": true
    },
    "state": {
      "type": "enumeration",
      "enum": ["unpublished", "published", "archived"],
      "required": true,
      "default": "unpublished"
    },
    "address": {
      "type": "richtext",
      "required": true
    },
    "phone": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "required": true
    },
    "display_order": {
      "type": "integer"
    },
    "created_by": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    }
  }
}
EOF

# 9. Social Media Collection
cat > src/api/social-media/content-types/social-media/schema.json << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "social_media",
  "info": {
    "singularName": "social-media",
    "pluralName": "social-medias",
    "displayName": "Social Media",
    "description": "Social media platforms and links with categorization and ordering"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "uid": {
      "type": "uid",
      "targetField": "title",
      "required": true,
      "unique": true
    },
    "title": {
      "type": "string",
      "required": true
    },
    "logo": {
      "type": "media",
      "allowedTypes": ["images"],
      "multiple": false,
      "required": true
    },
    "category": {
      "type": "enumeration",
      "enum": [
        "general",
        "footer",
        "header",
        "sidebar"
      ],
      "required": true
    },
    "state": {
      "type": "enumeration",
      "enum": ["unpublished", "published", "archived"],
      "required": true,
      "default": "unpublished"
    },
    "link": {
      "type": "string",
      "required": true
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "required": true
    },
    "display_order": {
      "type": "integer"
    },
    "created_by": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    }
  }
}
EOF

# 10. Content Search Config Collection
cat > src/api/content-search-config/content-types/content-search-config/schema.json << 'EOF'
{
  "kind": "collectionType",
  "collectionName": "content_search_configs",
  "info": {
    "singularName": "content-search-config",
    "pluralName": "content-search-configs",
    "displayName": "Content Search Config",
    "description": "Dynamic and custom content search configuration for Sunbird integration"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "mode": {
      "type": "enumeration",
      "enum": ["dynamic", "custom"],
      "required": true
    },
    "do_ids": {
      "type": "component",
      "repeatable": true,
      "component": "sunbird.sunbird-doid"
    },
    "sort_field": {
      "type": "enumeration",
      "enum": ["createdOn", "updatedOn"]
    },
    "sort_order": {
      "type": "enumeration",
      "enum": ["ASC", "DESC"]
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "required": true
    }
  }
}
EOF

echo "✅ All collection schemas created"

echo ""
echo "🎉 SUCCESS! All NULP Strapi collections have been created!"
echo "=============================================="
echo ""
echo "📋 Created Collections:"
echo "  1. Category (categories) - Hierarchical categorization"
echo "  2. Media Asset (media_assets) - Media management with metadata"
echo "  3. Article (articles) - Rich content with publishing workflow"
echo "  4. Menu (menus) - Dynamic navigation with hierarchy"
echo "  5. Banner (banners) - Visual banners with rich content"
echo "  6. Testimonial (testimonials) - User testimonials"
echo "  7. Partner (partners) - Business partner management"
echo "  8. Contact Us (contact_us) - Contact information"
echo "  9. Social Media (social_media) - Social platform links"
echo "  10. Content Search Config (content_search_configs) - Sunbird integration"
echo ""
echo "🔧 Created Components:"
echo "  • common.meta-tag - Reusable meta tagging"
echo "  • sunbird.sunbird-doid - Sunbird Digital Object IDs"
echo ""
echo "🚀 Next Steps:"
echo "  1. Restart your Strapi server: npm run develop"
echo "  2. Access admin panel: http://localhost:1337/admin"
echo "  3. Configure permissions in Settings > Roles"
echo "  4. Start adding content!"
echo ""
echo "📚 Features Included:"
echo "  ✅ Rich text editing with native Strapi fields"
echo "  ✅ Hierarchical structures (categories, menus)"
echo "  ✅ Media management with proper file type restrictions"
echo "  ✅ Publishing workflows with scheduling"
echo "  ✅ User tracking and audit trails"
echo "  ✅ SEO-optimized with unique slugs"
echo "  ✅ Sunbird platform integration for educational content"
echo "  ✅ Flexible categorization across all content types"
echo ""
echo "🎓 Perfect for educational platforms like NULP!"
#EOF

# Make the script executable
#chmod +x create-collections.sh

echo "✅ Script created successfully!"
echo ""
echo "🚀 **One-Click Collection Creation Script Ready!**"
echo ""
echo "**To create all collections, run:**"
echo "```bash"
echo "./create-collections.sh"
echo "```"
echo ""
echo "**What this script does:**"
echo "- Creates all 10 collection types we built"
echo "- Creates 2 reusable components (meta-tag, sunbird-doid)"
echo "- Sets up proper directory structure"
echo "- Generates all schema.json files with correct relationships"
echo ""
echo "**After running the script:**"
echo "1. Restart Strapi: `npm run develop`"
echo "2. All collections will be available in the admin panel"
echo "3. Configure API permissions as needed"
echo ""
echo "**Collections included:**"
echo "1. **Category** - Hierarchical categorization"
echo "2. **Media Asset** - Advanced media management"  
echo "3. **Article** - Rich text content management"
echo "4. **Menu** - Dynamic navigation management"
echo "5. **Banner** - Visual banner management"
echo "6. **Testimonial** - User testimonials"
echo "7. **Partner** - Business partner management"
echo "8. **Contact Us** - Contact information"
echo "9. **Social Media** - Social platform links"
echo "10. **Content Search Config** - Sunbird integration"
echo ""
echo "The script is production-ready and includes all the features we discussed! 🎉"
