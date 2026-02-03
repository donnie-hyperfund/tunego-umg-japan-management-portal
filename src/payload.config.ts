import { buildConfig } from 'payload/config';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { slateEditor } from '@payloadcms/richtext-slate';
import { cloudStorage } from '@payloadcms/plugin-cloud-storage';
import { vercelBlobStorage } from '@payloadcms/plugin-cloud-storage/vercel-blob';
import path from 'path';

export default buildConfig({
  admin: {
    user: 'users',
  },
  editor: slateEditor({}),
  collections: [
    {
      slug: 'users',
      auth: true,
      admin: {
        useAsTitle: 'email',
      },
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
        {
          name: 'firstName',
          type: 'text',
        },
        {
          name: 'lastName',
          type: 'text',
        },
      ],
    },
    {
      slug: 'site-templates',
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          unique: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'templatePath',
          type: 'text',
          required: true,
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      slug: 'campaign-sites',
      admin: {
        useAsTitle: 'displayName',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          unique: true,
        },
        {
          name: 'displayName',
          type: 'text',
          required: true,
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
            { label: 'Archived', value: 'archived' },
          ],
          defaultValue: 'draft',
          required: true,
        },
        {
          name: 'template',
          type: 'relationship',
          relationTo: 'site-templates',
        },
        {
          name: 'vercelProjectId',
          type: 'text',
        },
        {
          name: 'vercelDeploymentUrl',
          type: 'text',
        },
        {
          name: 'createdBy',
          type: 'relationship',
          relationTo: 'users',
        },
      ],
    },
    {
      slug: 'campaign-site-content',
      admin: {
        useAsTitle: 'section',
      },
      fields: [
        {
          name: 'site',
          type: 'relationship',
          relationTo: 'campaign-sites',
          required: true,
        },
        {
          name: 'section',
          type: 'select',
          options: [
            { label: 'Hero', value: 'hero' },
            { label: 'Description', value: 'description' },
            { label: 'Cards', value: 'cards' },
            { label: 'Signup', value: 'signup' },
          ],
          required: true,
        },
        {
          name: 'contentType',
          type: 'select',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Rich Text', value: 'richText' },
            { label: 'Image', value: 'image' },
            { label: 'Video', value: 'video' },
            { label: 'Card Manifest', value: 'cardManifest' },
          ],
          required: true,
        },
        {
          name: 'content',
          type: 'json',
          required: true,
        },
        {
          name: 'order',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'isVisible',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      slug: 'campaign-assets',
      admin: {
        useAsTitle: 'filename',
      },
      fields: [
        {
          name: 'site',
          type: 'relationship',
          relationTo: 'campaign-sites',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Video', value: 'video' },
            { label: 'Audio', value: 'audio' },
            { label: 'Document', value: 'document' },
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'filename',
          type: 'text',
          required: true,
        },
        {
          name: 'mimeType',
          type: 'text',
        },
        {
          name: 'size',
          type: 'number',
        },
        {
          name: 'uploadedBy',
          type: 'relationship',
          relationTo: 'users',
        },
      ],
      upload: {
        staticDir: 'media',
      },
    },
    {
      slug: 'card-manifests',
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'site',
          type: 'relationship',
          relationTo: 'campaign-sites',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'manifest',
          type: 'json',
          required: true,
        },
        {
          name: 'cardImageUrl',
          type: 'text',
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  ],
  plugins: [
    cloudStorage({
      collections: {
        'campaign-assets': {
          adapter: vercelBlobStorage({
            token: process.env.BLOB_READ_WRITE_TOKEN || '',
          }),
        },
      },
    }),
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
});
