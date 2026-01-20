from fastapi import APIRouter, Depends

from dependencies import CurrentUser, StorageDep
from models.card import Card, CardCreate, CardUpdate
from models.deck import Deck, DeckCreate, DeckResponse, DeckUpdate, DeckWithCards
from services.deck_service import DeckService

router = APIRouter()


def get_deck_service(storage: StorageDep) -> DeckService:
    return DeckService(storage)


@router.get("", response_model=list[DeckResponse])
async def list_decks(
    user: CurrentUser,
    deck_service: DeckService = Depends(get_deck_service),
):
    """List all decks for the current user."""
    return await deck_service.list_decks(user.id)


@router.post("", response_model=Deck)
async def create_deck(
    deck_data: DeckCreate,
    user: CurrentUser,
    deck_service: DeckService = Depends(get_deck_service),
):
    """Create a new deck."""
    return await deck_service.create_deck(user.id, deck_data)


@router.get("/{deck_id}", response_model=DeckWithCards)
async def get_deck(
    deck_id: str,
    user: CurrentUser,
    deck_service: DeckService = Depends(get_deck_service),
):
    """Get a deck with its cards."""
    return await deck_service.get_deck(deck_id, user.id)


@router.put("/{deck_id}", response_model=Deck)
async def update_deck(
    deck_id: str,
    update_data: DeckUpdate,
    user: CurrentUser,
    deck_service: DeckService = Depends(get_deck_service),
):
    """Update deck metadata."""
    return await deck_service.update_deck(deck_id, user.id, update_data)


@router.delete("/{deck_id}")
async def delete_deck(
    deck_id: str,
    user: CurrentUser,
    deck_service: DeckService = Depends(get_deck_service),
):
    """Delete a deck and all its cards."""
    await deck_service.delete_deck(deck_id, user.id)
    return {"message": "Deck deleted successfully"}


@router.post("/{deck_id}/cards", response_model=Card)
async def add_card(
    deck_id: str,
    card_data: CardCreate,
    user: CurrentUser,
    deck_service: DeckService = Depends(get_deck_service),
):
    """Add a card to a deck."""
    return await deck_service.add_card(deck_id, user.id, card_data)


@router.put("/{deck_id}/cards/{card_id}", response_model=Card)
async def update_card(
    deck_id: str,
    card_id: str,
    update_data: CardUpdate,
    user: CurrentUser,
    deck_service: DeckService = Depends(get_deck_service),
):
    """Update a card."""
    return await deck_service.update_card(deck_id, card_id, user.id, update_data)


@router.delete("/{deck_id}/cards/{card_id}")
async def delete_card(
    deck_id: str,
    card_id: str,
    user: CurrentUser,
    deck_service: DeckService = Depends(get_deck_service),
):
    """Delete a card from a deck."""
    await deck_service.delete_card(deck_id, card_id, user.id)
    return {"message": "Card deleted successfully"}
