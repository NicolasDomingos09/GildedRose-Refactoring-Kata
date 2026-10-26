import { Item, GildedRose } from '@/gilded-rose';

/**
 * Testes de caracterização: congelam o comportamento ATUAL do código legado,
 * servindo como rede de segurança antes de qualquer refatoração ou
 * adição de regra de negócio.
 */

function updateOverDays(item: Item, days: number): Item {
  const gildedRose = new GildedRose([item]);
  for (let i = 0; i < days; i++) {
    gildedRose.updateQuality();
  }
  return gildedRose.items[0];
}

describe('Gilded Rose - lógica legada (caracterização)', () => {
  describe('Itens comuns', () => {
    it('degrada quality em 1 e sellIn em 1 por dia', () => {
      const item = updateOverDays(new Item('+5 Dexterity Vest', 10, 20), 1);
      expect(item.sellIn).toBe(9);
      expect(item.quality).toBe(19);
    });

    it('degrada quality em 2 por dia após o prazo de venda expirar', () => {
      const item = updateOverDays(new Item('Elixir of the Mongoose', 0, 10), 1);
      expect(item.sellIn).toBe(-1);
      expect(item.quality).toBe(8);
    });

    it('nunca tem quality negativa', () => {
      const item = updateOverDays(new Item('Common Sword', 5, 0), 1);
      expect(item.quality).toBe(0);
      expect(item.sellIn).toBe(4);
    });

    it('continua sem quality negativa vários dias após expirar', () => {
      const item = updateOverDays(new Item('Common Shield', -1, 3), 2);
      expect(item.quality).toBe(0);
    });
  });

  describe('Aged Brie', () => {
    it('aumenta quality em 1 por dia (quanto mais velho, melhor)', () => {
      const item = updateOverDays(new Item('Aged Brie', 2, 0), 1);
      expect(item.sellIn).toBe(1);
      expect(item.quality).toBe(1);
    });

    it('continua aumentando quality após o prazo expirar (duplo incremento)', () => {
      const item = updateOverDays(new Item('Aged Brie', -1, 48), 1);
      expect(item.quality).toBe(50);
    });

    it('nunca tem quality acima de 50', () => {
      const item = updateOverDays(new Item('Aged Brie', 2, 50), 1);
      expect(item.sellIn).toBe(1);
      expect(item.quality).toBe(50);
    });
  });

  describe('Sulfuras, Hand of Ragnaros', () => {
    it('nunca muda: nem quality, nem sellIn', () => {
      const item = updateOverDays(new Item('Sulfuras, Hand of Ragnaros', 0, 80), 1);
      expect(item.sellIn).toBe(0);
      expect(item.quality).toBe(80);
    });

    it('permanece intacto mesmo expirado', () => {
      const item = updateOverDays(new Item('Sulfuras, Hand of Ragnaros', -1, 80), 1);
      expect(item.sellIn).toBe(-1);
      expect(item.quality).toBe(80);
    });
  });

  describe('Backstage passes to a TAFKAL80ETC concert', () => {
    it('aumenta quality em 1 quando faltam mais de 10 dias', () => {
      const item = updateOverDays(
        new Item('Backstage passes to a TAFKAL80ETC concert', 15, 20),
        1,
      );
      expect(item.sellIn).toBe(14);
      expect(item.quality).toBe(21);
    });

    it('aumenta quality em 2 quando faltam 10 dias ou menos', () => {
      const item = updateOverDays(
        new Item('Backstage passes to a TAFKAL80ETC concert', 10, 20),
        1,
      );
      expect(item.sellIn).toBe(9);
      expect(item.quality).toBe(22);
    });

    it('aumenta quality em 3 quando faltam 5 dias ou menos', () => {
      const item = updateOverDays(
        new Item('Backstage passes to a TAFKAL80ETC concert', 5, 20),
        1,
      );
      expect(item.sellIn).toBe(4);
      expect(item.quality).toBe(23);
    });

    it('nunca tem quality acima de 50', () => {
      const item = updateOverDays(
        new Item('Backstage passes to a TAFKAL80ETC concert', 5, 49),
        1,
      );
      expect(item.quality).toBe(50);
    });

    it('zera quality após o show (sellIn expirado)', () => {
      const item = updateOverDays(
        new Item('Backstage passes to a TAFKAL80ETC concert', 0, 20),
        1,
      );
      expect(item.sellIn).toBe(-1);
      expect(item.quality).toBe(0);
    });
  });

  describe('Itens Conjured (nova regra de negócio)', () => {
    it('degrada quality em 2 por dia enquanto o prazo não expirou', () => {
      const item = updateOverDays(new Item('Conjured Mana Cake', 3, 6), 1);
      expect(item.sellIn).toBe(2);
      expect(item.quality).toBe(4);
    });

    it('degrada quality em 4 por dia após o prazo de venda expirar', () => {
      const item = updateOverDays(new Item('Conjured Mana Cake', 0, 6), 1);
      expect(item.sellIn).toBe(-1);
      expect(item.quality).toBe(2);
    });

    it('nunca tem quality negativa ao degradar 2x', () => {
      const item = updateOverDays(new Item('Conjured Mana Cake', 5, 1), 1);
      expect(item.quality).toBe(0);
    });

    it('zera quality sem ficar negativo após expirar com pouco estoque', () => {
      const item = updateOverDays(new Item('Conjured Mana Cake', 0, 1), 1);
      expect(item.quality).toBe(0);
    });

    it('nunca tem quality negativa mesmo vários dias após expirar', () => {
      const item = updateOverDays(new Item('Conjured Mana Cake', -1, 3), 2);
      expect(item.quality).toBe(0);
    });
  });

  describe('Processamento de vários itens', () => {
    it('atualiza todos os itens do estoque em uma chamada', () => {
      const gildedRose = new GildedRose([
        new Item('+5 Dexterity Vest', 10, 20),
        new Item('Aged Brie', 2, 0),
        new Item('Sulfuras, Hand of Ragnaros', 0, 80),
      ]);
      const items = gildedRose.updateQuality();
      expect(items.map((i) => `${i.name} ${i.sellIn} ${i.quality}`)).toEqual([
        '+5 Dexterity Vest 9 19',
        'Aged Brie 1 1',
        'Sulfuras, Hand of Ragnaros 0 80',
      ]);
    });
  });
});
