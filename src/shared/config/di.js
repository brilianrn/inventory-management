import { InMemoryAccessRepository } from '@/packages/access/repository/in-memory.repository';
import { AccessUseCase } from '@/packages/access/usecase';
import { InMemoryCatalogRepository } from '@/packages/catalog/repository/in-memory.repository';
import { CatalogUseCase } from '@/packages/catalog/usecase';
import { InMemoryDocumentRepository } from '@/packages/documents/repository/in-memory.repository';
import { DocumentUseCase } from '@/packages/documents/usecase';
import { getSeed } from '@/seed';

const createRepositories = () => {
  const seed = getSeed();

  return {
    access: new InMemoryAccessRepository(seed),
    catalog: new InMemoryCatalogRepository(seed),
    documents: new InMemoryDocumentRepository(seed),
  };
};

let container = null;

export const getContainer = () => {
  if (!container) {
    const repositories = createRepositories();

    container = {
      repositories,
      usecases: {
        access: new AccessUseCase(repositories.access),
        catalog: new CatalogUseCase(repositories.catalog),
        documents: new DocumentUseCase(repositories.documents),
      },
    };
  }

  return container;
};

export const getUseCases = () => getContainer().usecases;
