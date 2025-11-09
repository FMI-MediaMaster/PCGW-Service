import runMetadataTests, { Fields } from '@media-master/metadata-service-tests';
import { Express } from 'express';
import { describe } from 'vitest';
import app from '../src/app';

const server = app as Express;

describe('Controller', () => {
    const endpoint: string = '';
    const validMap: object = {
        'Hollow Knight': 'Hollow Knight',
        'God Of War': 'God of War',
        'League Of Legends': 'League of Legends',
    };
    const invalidMap: object = {
        'adasdasa': '-1',
        '' : 'Not a game',
        'nonExistentMovie': 'nonExistentId',
    };
    const fieldsMap: Record<string, Fields> = {
        options: {
            name: { type: 'string' },
        },
    };

    runMetadataTests(
        server,
        endpoint,
        { validMap, invalidMap, fieldsMap, type: 'game' }
    );
});

