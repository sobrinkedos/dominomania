import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { GameWithDetails, gamesService } from '@/services/gamesService';
import { Feather } from '@expo/vector-icons';
import { formatDate } from '@/utils/date';
import { InternalHeader } from '@/components/InternalHeader';
import { useTheme } from 'styled-components/native';

export default function GamesPage() {
    const router = useRouter();
    const [games, setGames] = useState<GameWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const { colors } = useTheme();

    useEffect(() => {
        loadGames();
    }, []);

    const loadGames = async () => {
        try {
            setLoading(true);
            const games = await gamesService.getUserGames();
            setGames(games);
        } catch (error) {
            console.error('Erro ao carregar jogos:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <LoadingContainer>
                <ActivityIndicator size="large" color={colors.accent} />
            </LoadingContainer>
        );
    }

    return (
        <Container>
            <InternalHeader title="Meus Jogos" />
            <ScrollView>
                <ContentContainer>
                    {games.map((game) => (
                        <GameCard key={game.id}>
                            <CommunityName>{game.competition.community.name}</CommunityName>
                            <CompetitionName>{game.competition.name}</CompetitionName>
                            
                            <TeamsContainer>
                                <TeamContainer>
                                    <TeamScore winner={game.team1_score > game.team2_score}>
                                        {game.team1_score}
                                    </TeamScore>
                                    <TeamPlayers>
                                        {game.team1_players.map(player => player.name).join(' & ')}
                                    </TeamPlayers>
                                </TeamContainer>

                                <VsText>vs</VsText>

                                <TeamContainer>
                                    <TeamScore winner={game.team2_score > game.team1_score}>
                                        {game.team2_score}
                                    </TeamScore>
                                    <TeamPlayers>
                                        {game.team2_players.map(player => player.name).join(' & ')}
                                    </TeamPlayers>
                                </TeamContainer>
                            </TeamsContainer>

                            <GameDetails>
                                {game.is_buchuda && (
                                    <GameBadge>
                                        <Feather name="star" size={12} color={colors.accent} />
                                        <BadgeText>Buchuda</BadgeText>
                                    </GameBadge>
                                )}
                                {game.is_buchuda_de_re && (
                                    <GameBadge>
                                        <Feather name="star" size={12} color={colors.accent} />
                                        <BadgeText>Buchuda de Ré</BadgeText>
                                    </GameBadge>
                                )}
                                <GameDate>{formatDate(game.created_at)}</GameDate>
                            </GameDetails>
                        </GameCard>
                    ))}
                </ContentContainer>
            </ScrollView>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const ContentContainer = styled.View`
    padding: 16px;
`;

const GameCard = styled.View`
    background-color: ${({ theme }) => theme.colors.secondary};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
`;

const CommunityName = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: 4px;
`;

const CompetitionName = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 12px;
`;

const TeamsContainer = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
`;

const TeamContainer = styled.View`
    flex: 1;
    align-items: center;
`;

const TeamScore = styled.Text<{ winner: boolean }>`
    font-size: 24px;
    font-weight: bold;
    color: ${props => props.winner ? props.theme.colors.accent : props.theme.colors.textSecondary};
    margin-bottom: 4px;
`;

const TeamPlayers = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    text-align: center;
`;

const VsText = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0 12px;
`;

const GameDetails = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
`;

const GameBadge = styled.View`
    flex-direction: row;
    align-items: center;
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    padding: 4px 8px;
    border-radius: 4px;
    gap: 4px;
`;

const BadgeText = styled.Text`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
`;

const GameDate = styled.Text`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-left: auto;
`;
